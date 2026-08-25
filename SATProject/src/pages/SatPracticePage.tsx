import { useEffect, useRef, useState } from 'react';
import { Empty, Select, Spin, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, Brain, CheckCircle2, RefreshCw, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import type { AnswerResponse, SatQuestion } from '../types/sat';
import { SatService } from '../services/satService';
import { DashboardService } from '../services/dashboardService';
import SatQuestionCard from '../components/SatQuestionCard';
import { getDomainDisplayName } from '../utils/domainMapping';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';

const createSubmissionId = () => globalThis.crypto?.randomUUID?.() || `answer-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function SatPracticePage() {
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<SatQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restoringAnswer, setRestoringAnswer] = useState(false);
  const [restoredFromHistory, setRestoredFromHistory] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionId] = useState(() => `practice-session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0 });
  const [answerSummary, setAnswerSummary] = useState({ answeredQuestions: 0, correctAnswers: 0, accuracy: 0 });
  const questionStartedAt = useRef(Date.now());
  const submissionId = useRef(createSubmissionId());
  const submitInFlight = useRef(false);

  useEffect(() => {
    const initialise = async () => {
      try {
        const [domainList, summary] = await Promise.all([SatService.getAllDomains(), SatService.getAnswerSummary()]);
        setDomains(domainList);
        setAnswerSummary(summary);

        if (searchParams.get('focus') === 'weakest') {
          const stats = await DashboardService.getUserStats();
          const weakest = [...stats.domainStats]
            .filter(domain => domain.totalQuestions > domain.answeredQuestions)
            .sort((a, b) => a.averageScore - b.averageScore || b.answeredQuestions - a.answeredQuestions)[0];
          const domain = weakest?.domain || '';
          setSelectedDomain(domain);
          await loadQuestions(domain, questionCount);
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Practice setup could not be loaded.');
      }
    };
    void initialise();
    // The initial query is intentionally read once to avoid restarting a session on every filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSummary = async () => {
    try {
      setAnswerSummary(await SatService.getAnswerSummary());
    } catch {
      // The active session remains usable if the dashboard snapshot is briefly unavailable.
    }
  };

  const loadQuestions = async (domain = selectedDomain, count = questionCount) => {
    setLoading(true);
    setHasStarted(true);
    try {
      const nextQuestions = domain
        ? await SatService.getQuestionsByDomain(domain, count)
        : await SatService.getRandomQuestions(count);
      setQuestions(nextQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setAnswerResult(null);
      setRestoredFromHistory(false);
      setSessionStats({ answered: 0, correct: 0 });
      questionStartedAt.current = Date.now();
      submissionId.current = createSubmissionId();
      if (!nextQuestions.length) message.info('No new quality-screened questions match this setup. Try another domain.');
    } catch (error) {
      setQuestions([]);
      message.error(error instanceof Error ? error.message : 'Questions could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const startAdaptive = async () => {
    setLoading(true);
    try {
      const stats = await DashboardService.getUserStats();
      const weakest = [...stats.domainStats]
        .filter(domain => domain.totalQuestions > domain.answeredQuestions)
        .sort((a, b) => a.averageScore - b.averageScore || b.answeredQuestions - a.answeredQuestions)[0];
      const domain = weakest?.domain || '';
      setSelectedDomain(domain);
      await loadQuestions(domain, questionCount);
      if (domain) message.success(`Focused on ${getDomainDisplayName(domain)}, your current growth area.`);
    } catch {
      await loadQuestions('', questionCount);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const question = questions[currentQuestionIndex];
    if (!question || !selectedAnswer || answerResult || submitInFlight.current) return;
    submitInFlight.current = true;
    setSubmitting(true);
    try {
      const result = await SatService.submitAnswerWithRecord({
        questionId: question.id,
        answer: selectedAnswer,
        sessionId,
        submissionId: submissionId.current,
        studyMode: 'practice',
        responseTimeMs: Math.max(0, Date.now() - questionStartedAt.current),
      });
      setAnswerResult(result);
      setRestoredFromHistory(false);
      setSessionStats(previous => ({ answered: previous.answered + 1, correct: previous.correct + (result.isCorrect ? 1 : 0) }));
      void refreshSummary();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Your answer could not be saved.');
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  const navigateToQuestion = async (index: number) => {
    const target = questions[index];
    if (!target) return;
    setCurrentQuestionIndex(index);
    setSelectedAnswer('');
    setAnswerResult(null);
    setRestoredFromHistory(false);
    setRestoringAnswer(true);
    questionStartedAt.current = Date.now();
    submissionId.current = createSubmissionId();
    try {
      const recorded = await SatService.getRecordedAnswer(target.id, sessionId);
      if (recorded) {
        setSelectedAnswer(recorded.userAnswer);
        setAnswerResult(recorded);
        setRestoredFromHistory(true);
      }
    } catch {
      message.error('The saved attempt for this question could not be restored.');
    } finally {
      setRestoringAnswer(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const sessionAccuracy = sessionStats.answered ? Math.round((sessionStats.correct / sessionStats.answered) * 100) : 0;

  return (
    <div className="page-shell practice-page">
      <header className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="page-kicker flex items-center gap-2"><Target size={14} /> Focused practice</p>
          <h1 className="page-title mt-3">Build a session with <em className="font-light text-teal-800">purpose.</em></h1>
          <p className="page-subtitle mt-5">Choose a domain or let SAT-Buddy focus on your weakest area. New sets use only quality-screened, unanswered questions.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-stone-600">
          <span className="rounded-full border border-stone-900/10 bg-white/70 px-4 py-2">{answerSummary.accuracy}% all-time accuracy</span>
          <span className="rounded-full border border-stone-900/10 bg-white/70 px-4 py-2">{answerSummary.answeredQuestions} unique answered</span>
        </div>
      </header>

      <Card className="mb-7 overflow-hidden p-0">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.15em] text-[#123d3a]"><SlidersHorizontal size={16} /> Session setup</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-stone-700">
                Domain
                <Select
                  value={selectedDomain || undefined}
                  placeholder="Mixed domains"
                  allowClear
                  onChange={value => setSelectedDomain(value || '')}
                  options={domains.map(domain => ({ value: domain, label: getDomainDisplayName(domain) }))}
                  aria-label="Practice domain"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-stone-700">
                Session length
                <Select
                  value={questionCount}
                  onChange={setQuestionCount}
                  options={[5, 10, 20, 30].map(count => ({ value: count, label: `${count} questions` }))}
                  aria-label="Number of questions"
                />
              </label>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3 border-t border-stone-900/10 bg-[#e6d8bb]/25 p-5 sm:flex-row lg:min-w-[310px] lg:flex-col lg:border-l lg:border-t-0 lg:p-7">
            <Button size="lg" onClick={() => void loadQuestions()} disabled={loading || submitting} className="w-full"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> {hasStarted ? 'Start a new set' : 'Start practice'}</Button>
            <Button size="lg" variant="secondary" onClick={() => void startAdaptive()} disabled={loading || submitting} className="w-full"><Sparkles size={17} /> Smart focus</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="grid min-h-72 place-items-center p-10 text-center"><div><Spin size="large" /><p className="mt-4 text-sm text-stone-500">Building a clean question set…</p></div></Card>
      ) : !hasStarted ? (
        <Card className="grid min-h-72 place-items-center overflow-hidden p-8 text-center">
          <div className="max-w-xl">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#123d3a] text-[#f4d8cc]"><Brain size={25} /></span>
            <h2 className="mt-6 font-display text-3xl font-semibold">Ready when you are.</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">Start a deliberate set, or choose Smart focus to target the domain with the most room to grow.</p>
          </div>
        </Card>
      ) : !currentQuestion ? (
        <Card className="grid min-h-72 place-items-center p-8"><Empty description="No available questions for this setup" /></Card>
      ) : (
        <div className="grid gap-5">
          <Card className="p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-center">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-stone-500">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-gradient-to-r from-[#123d3a] to-[#2ba89c] transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-teal-800/10 px-3 py-2 font-extrabold text-teal-900">{getDomainDisplayName(currentQuestion.domain)}</span>
                {sessionStats.answered > 0 && <span className="flex items-center gap-1 font-bold text-stone-500"><BarChart3 size={15} /> {sessionAccuracy}% this set</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={currentQuestionIndex === 0 || restoringAnswer || submitting} onClick={() => void navigateToQuestion(currentQuestionIndex - 1)} aria-label="Previous question"><ArrowLeft size={16} /> <span className="hidden sm:inline">Previous</span></Button>
                <Button variant="secondary" size="sm" disabled={currentQuestionIndex === questions.length - 1 || restoringAnswer || submitting} onClick={() => void navigateToQuestion(currentQuestionIndex + 1)} aria-label="Next question"><span className="hidden sm:inline">Next</span> <ArrowRight size={16} /></Button>
              </div>
            </div>
            {restoredFromHistory && <p className="mt-4 flex items-center gap-2 rounded-xl bg-teal-800/8 px-3 py-2 text-xs font-bold text-teal-900"><CheckCircle2 size={15} /> Saved attempt restored. This answer is locked to protect your history.</p>}
          </Card>

          <SatQuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={answer => { if (!answerResult) setSelectedAnswer(answer); }}
            onSubmitAnswer={() => void submitAnswer()}
            answerResult={answerResult}
            showAnswer={Boolean(answerResult)}
            celebrateOnCorrect={!restoredFromHistory}
            submitting={submitting}
          />

          {answerResult && (
            <div className={cn('flex flex-col gap-3 rounded-[1.5rem] border p-5 sm:flex-row sm:items-center sm:justify-between', currentQuestionIndex === questions.length - 1 ? 'border-[#e96b4d]/25 bg-[#e96b4d]/8' : 'border-stone-900/10 bg-white/65')}>
              <div><p className="font-display text-2xl font-semibold">{currentQuestionIndex === questions.length - 1 ? 'Set complete.' : 'Keep the rhythm.'}</p><p className="mt-1 text-xs text-stone-500">Your review date is saved automatically with this attempt.</p></div>
              {currentQuestionIndex < questions.length - 1 ? <Button onClick={() => void navigateToQuestion(currentQuestionIndex + 1)}>Next question <ArrowRight size={17} /></Button> : <Button onClick={() => void loadQuestions()}>Build another set <RefreshCw size={17} /></Button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
