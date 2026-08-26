import { useEffect, useRef, useState } from 'react';
import { Empty, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Flame, RefreshCw, Sparkles, Target } from 'lucide-react';
import type { AnswerResponse, NextQuestionResponse, SatQuestion } from '../types/sat';
import { SatService } from '../services/satService';
import SatQuestionCard from '../components/SatQuestionCard';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { GuestTrialBanner, SignInPrompt, SignInPromptModal, type SignInPromptReason } from '../components/guest';
import { useGuestAccess } from '../hooks/useGuestAccess';
import { createGuestTrialOwnerId, guestTrialService } from '../services/guestTrialService';

const QUICK_SESSION_TARGET = 5;
const createSubmissionId = () => globalThis.crypto?.randomUUID?.() || `quick-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function SatSingleQuestionPage() {
  const navigate = useNavigate();
  const guestAccess = useGuestAccess();
  const [currentQuestion, setCurrentQuestion] = useState<SatQuestion | null>(null);
  const [guestQuestions, setGuestQuestions] = useState<SatQuestion[]>([]);
  const [guestQuestionIndex, setGuestQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [answerSummary, setAnswerSummary] = useState({ answeredQuestions: 0, correctAnswers: 0, accuracy: 0 });
  const [signInReason, setSignInReason] = useState<SignInPromptReason | null>(null);
  const questionStartedAt = useRef(Date.now());
  const submissionId = useRef(createSubmissionId());
  const submitInFlight = useRef(false);
  const initialiseInFlight = useRef(false);
  const guestTrialOwner = useRef(createGuestTrialOwnerId());

  useEffect(() => {
    const initialise = async () => {
      if (initialiseInFlight.current) return;
      initialiseInFlight.current = true;
      try {
        if (!guestAccess.signedIn) {
          const access = await guestTrialService.reserveTrial('quick', guestTrialOwner.current);
          if (!access.allowed) {
            setLoading(false);
            setSignInReason(access.reason);
            return;
          }

          const questions = await SatService.getRandomQuestions(QUICK_SESSION_TARGET);
          setGuestQuestions(questions);
          setGuestQuestionIndex(0);
          setCurrentQuestion(questions[0] || null);
          setHasMoreQuestions(questions.length > 1);
          if (questions.length) guestTrialService.completeTrial('quick', guestTrialOwner.current);
          else guestTrialService.releaseTrial('quick', guestTrialOwner.current);
          setLoading(false);
          return;
        }

        const [newSessionId, summary] = await Promise.all([SatService.generateSession(), SatService.getAnswerSummary()]);
        setSessionId(newSessionId);
        setAnswerSummary(summary);
      } catch (error) {
        if (!guestAccess.signedIn) {
          guestTrialService.releaseTrial('quick', guestTrialOwner.current);
        }
        setLoading(false);
        message.error(error instanceof Error ? error.message : 'Daily Quick could not start.');
      } finally {
        initialiseInFlight.current = false;
      }
    };
    void initialise();
  }, [guestAccess.signedIn]);

  useEffect(() => {
    if (sessionId) void loadNextQuestion(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const refreshSummary = async () => {
    if (!guestAccess.signedIn) return;
    try { setAnswerSummary(await SatService.getAnswerSummary()); } catch { /* keep the active session moving */ }
  };

  const loadNextQuestion = async (activeSessionId = sessionId) => {
    if (!guestAccess.signedIn) {
      if (sessionAnswered >= QUICK_SESSION_TARGET) {
        setSignInReason('trial-completed');
        return;
      }
      const nextIndex = guestQuestionIndex + 1;
      const nextQuestion = guestQuestions[nextIndex];
      if (!nextQuestion) {
        setSignInReason('trial-completed');
        return;
      }
      setGuestQuestionIndex(nextIndex);
      setCurrentQuestion(nextQuestion);
      setSelectedAnswer('');
      setAnswerResult(null);
      setHasMoreQuestions(nextIndex < guestQuestions.length - 1);
      questionStartedAt.current = Date.now();
      submissionId.current = createSubmissionId();
      return;
    }

    if (!activeSessionId) return;
    setLoading(true);
    setSelectedAnswer('');
    setAnswerResult(null);
    try {
      const response: NextQuestionResponse = await SatService.getNextQuestion({ sessionId: activeSessionId });
      setCurrentQuestion(response.question || null);
      setHasMoreQuestions(response.hasMoreQuestions);
      questionStartedAt.current = Date.now();
      submissionId.current = createSubmissionId();
      if (!response.question) message.info('You have completed every available new question. Your review queue may still be waiting.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'The next question could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer || answerResult || submitInFlight.current) return;
    submitInFlight.current = true;
    setSubmitting(true);
    try {
      const result = guestAccess.signedIn
        ? await SatService.submitAnswerWithRecord({
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          sessionId,
          submissionId: submissionId.current,
          studyMode: 'quick',
          responseTimeMs: Math.max(0, Date.now() - questionStartedAt.current),
        })
        : await SatService.checkAnswer({ questionId: currentQuestion.id, answer: selectedAnswer });
      setAnswerResult(result);
      setSessionAnswered(value => value + 1);
      if (result.isCorrect) setSessionCorrect(value => value + 1);
      void refreshSummary();
    } catch (error) {
      message.error(error instanceof Error ? error.message : guestAccess.signedIn ? 'Your answer could not be saved.' : 'Your answer could not be checked.');
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  const sessionAccuracy = sessionAnswered ? Math.round((sessionCorrect / sessionAnswered) * 100) : 0;
  const goalProgress = Math.min((sessionAnswered / QUICK_SESSION_TARGET) * 100, 100);

  return (
    <div className="page-shell single-question-page">
      <header className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="page-kicker flex items-center gap-2"><Sparkles size={14} /> Daily Quick</p>
          <h1 className="page-title mt-3">One question. <em className="font-light text-teal-800">Real momentum.</em></h1>
          <p className="page-subtitle mt-5">A low-friction mixed set for busy days. {guestAccess.signedIn ? 'Every answer joins your memory schedule automatically.' : 'Guest answers are checked without being added to history.'}</p>
        </div>
        {guestAccess.signedIn && <Button variant="secondary" onClick={() => void loadNextQuestion()} disabled={loading || submitting}><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Shuffle</Button>}
      </header>

      {!guestAccess.signedIn && <GuestTrialBanner alwaysShow className="mb-6" />}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-stone-400">Mini-session</span><Target size={18} className="text-[#e96b4d]" /></div>
          <strong className="mt-4 block font-display text-4xl">{sessionAnswered}<span className="text-xl text-stone-400">/{QUICK_SESSION_TARGET}</span></strong>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-[#e96b4d] transition-[width] duration-500" style={{ width: `${goalProgress}%` }} /></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-stone-400">This session</span><CheckCircle2 size={18} className="text-emerald-600" /></div>
          <strong className="mt-4 block font-display text-4xl">{sessionAccuracy}%</strong>
          <p className="mt-2 text-xs text-stone-500">{sessionCorrect} correct so far</p>
        </Card>
        <Card className="overflow-hidden bg-[#173c39] p-5 text-white">
          <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-white/50">{guestAccess.signedIn ? 'All-time' : 'Guest mode'}</span><Flame size={18} className="text-[#f1b49f]" /></div>
          <strong className="mt-4 block font-display text-4xl">{guestAccess.signedIn ? `${answerSummary.accuracy}%` : 'Private'}</strong>
          <p className="mt-2 text-xs text-white/45">{guestAccess.signedIn ? `Across ${answerSummary.answeredQuestions} unique questions` : 'Nothing from this set is saved'}</p>
        </Card>
      </div>

      {loading ? (
        <Card className="grid min-h-80 place-items-center"><div className="text-center"><Spin size="large" /><p className="mt-4 text-sm text-stone-500">Finding a fresh question…</p></div></Card>
      ) : currentQuestion ? (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-900/10 bg-white/60 px-4 py-3 text-xs font-bold text-stone-600">
            <span className="flex items-center gap-2"><Clock3 size={15} className="text-[#123d3a]" /> Mixed domains · unanswered · quality-screened</span>
            <span>{sessionAnswered >= QUICK_SESSION_TARGET ? 'Daily target complete — anything else is a bonus.' : `${QUICK_SESSION_TARGET - sessionAnswered} to your mini-session goal`}</span>
          </div>
          <SatQuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={answer => { if (!answerResult) setSelectedAnswer(answer); }}
            onSubmitAnswer={() => void submitAnswer()}
            answerResult={answerResult}
            showAnswer={Boolean(answerResult)}
            submitting={submitting}
          />
          {answerResult && (
            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-stone-900/10 bg-white/65 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-display text-2xl font-semibold">{guestAccess.signedIn ? 'Review scheduled.' : 'Answer checked.'}</p><p className="mt-1 text-xs text-stone-500">{guestAccess.signedIn ? (answerResult.isCorrect ? 'You’ll see this again after a longer gap.' : 'This one returns soon so the correction can stick.') : 'This result stays in the current tab and does not create a review record.'}</p></div>
              <Button onClick={() => void loadNextQuestion()} disabled={guestAccess.signedIn && !hasMoreQuestions}>{!guestAccess.signedIn && sessionAnswered >= QUICK_SESSION_TARGET ? 'Sign in to continue' : 'Next quick question'} <ArrowRight size={17} /></Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="grid min-h-80 place-items-center p-8 text-center">
          {signInReason ? (
            <SignInPrompt reason={signInReason} className="w-full max-w-3xl text-left" />
          ) : (
            <div className="max-w-md"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No new questions are waiting" /><p className="mt-4 text-sm leading-6 text-stone-500">New-question practice is complete for now. Scheduled review can still strengthen what you have learned.</p><Button className="mt-6" onClick={() => navigate('/review')}>Open memory review <ArrowRight size={17} /></Button></div>
          )}
        </Card>
      )}
      <SignInPromptModal
        open={Boolean(signInReason)}
        onClose={() => setSignInReason(null)}
        reason={signInReason || 'account-required'}
      />
    </div>
  );
}
