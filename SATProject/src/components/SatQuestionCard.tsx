import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { AlertCircle, Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, XCircle } from 'lucide-react';
import type { AnswerResponse, SatQuestion } from '../types/sat';
import type { MistakeReason } from '../types/learning';
import MathRenderer from './MathRenderer';
import QuestionVisual from './QuestionVisual';
import QuestionReportPanel from './QuestionReportPanel';
import { SignInPromptModal } from './guest';
import { FavoriteQuestionService } from '../services/favoriteQuestionService';
import { LearningService } from '../services/learningService';
import { useGuestAccess } from '../hooks/useGuestAccess';
import CorrectAnswerCelebration from './CorrectAnswerCelebration';
import { playCorrectAnswerChime, prepareFeedbackAudio } from '../utils/feedbackAudio';
import { getUserPreferences } from '../utils/userPreferences';
import { mistakeReasonOptions } from '../utils/learningLabels';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface SatQuestionCardProps {
  question: SatQuestion;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  onSubmitAnswer: () => void;
  answerResult: AnswerResponse | null;
  showAnswer?: boolean;
  celebrateOnCorrect?: boolean;
  submitLabel?: string;
  submitting?: boolean;
}

export default function SatQuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  onSubmitAnswer,
  answerResult,
  showAnswer = false,
  celebrateOnCorrect = true,
  submitLabel = 'Check answer',
  submitting = false,
}: SatQuestionCardProps) {
  const guestAccess = useGuestAccess();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reflectionReason, setReflectionReason] = useState<MistakeReason>('UNCLASSIFIED');
  const [reflectionConfidence, setReflectionConfidence] = useState<number | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  const [reflectionExpanded, setReflectionExpanded] = useState(false);
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionState, setReflectionState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [signInOpen, setSignInOpen] = useState(false);
  const reflectionInFlight = useRef(false);
  const reflectionRequestSequence = useRef(0);

  useEffect(() => {
    if (!guestAccess.signedIn) {
      setIsFavorited(false);
      return;
    }
    let active = true;
    FavoriteQuestionService.checkFavoriteStatus(question.id)
      .then(favorited => active && setIsFavorited(favorited))
      .catch(() => undefined);
    return () => { active = false; };
  }, [guestAccess.signedIn, question.id]);

  useEffect(() => {
    if (!showAnswer || !answerResult?.isCorrect || !celebrateOnCorrect) return;
    const preferences = getUserPreferences();
    setShowCelebration(preferences.celebrations);
    playCorrectAnswerChime();
    const timeout = window.setTimeout(() => setShowCelebration(false), 1700);
    return () => window.clearTimeout(timeout);
  }, [answerResult, celebrateOnCorrect, showAnswer]);

  useEffect(() => {
    reflectionRequestSequence.current += 1;
    setReflectionReason('UNCLASSIFIED');
    setReflectionConfidence(null);
    setReflectionNote('');
    setReflectionExpanded(false);
    setReflectionSaving(false);
    setReflectionState('idle');
    reflectionInFlight.current = false;
  }, [question.id]);

  const toggleFavorite = async () => {
    if (!guestAccess.signedIn) {
      setSignInOpen(true);
      return;
    }
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await FavoriteQuestionService.removeFavoriteQuestion(question.id);
        setIsFavorited(false);
        message.success('Removed from saved questions.');
      } else {
        await FavoriteQuestionService.addFavoriteQuestion({
          questionId: question.id,
          questionData: JSON.stringify(question),
        });
        setIsFavorited(true);
        message.success('Saved for later.');
      }
    } catch {
      message.error('That question could not be saved. Please try again.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const saveReflection = async (nextReason = reflectionReason) => {
    if (answerResult?.isCorrect || nextReason === 'UNCLASSIFIED' || reflectionInFlight.current) return;
    if (!guestAccess.signedIn) {
      setSignInOpen(true);
      return;
    }

    const requestSequence = ++reflectionRequestSequence.current;
    reflectionInFlight.current = true;
    setReflectionSaving(true);
    setReflectionState('idle');
    try {
      await LearningService.updateMistake(question.id, {
        reason: nextReason,
        confidence: reflectionConfidence,
        note: reflectionNote.trim(),
        resolved: false,
      });
      if (requestSequence === reflectionRequestSequence.current) setReflectionState('saved');
    } catch {
      if (requestSequence === reflectionRequestSequence.current) setReflectionState('error');
    } finally {
      if (requestSequence === reflectionRequestSequence.current) {
        reflectionInFlight.current = false;
        setReflectionSaving(false);
      }
    }
  };

  const chooseReflectionReason = (reason: MistakeReason) => {
    setReflectionReason(reason);
    setReflectionState('idle');
    void saveReflection(reason);
  };

  const options = [
    { key: 'A', value: question.choiceA },
    { key: 'B', value: question.choiceB },
    { key: 'C', value: question.choiceC },
    { key: 'D', value: question.choiceD },
  ].filter((option): option is { key: string; value: string } => Boolean(option.value));

  return (
    <article aria-busy={submitting} className="sat-question-card relative overflow-hidden rounded-[1.75rem] border border-stone-900/10 bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(31,41,39,.08)] sm:p-8">
      {showCelebration && <CorrectAnswerCelebration />}

      <header className="flex items-center justify-between gap-4 border-b border-stone-900/10 pb-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#c34f38]">Practice item</p>
          <p className="mt-1 text-xs text-stone-500">Question {question.id}</p>
        </div>
        <button
          type="button"
          aria-label={isFavorited ? 'Remove from saved questions' : 'Save question for later'}
          aria-pressed={isFavorited}
          disabled={favoriteLoading}
          onClick={() => void toggleFavorite()}
          className={cn(
            'grid size-11 place-items-center rounded-2xl border transition-all focus:outline-none focus:ring-4 focus:ring-teal-800/10 disabled:opacity-50',
            isFavorited ? 'border-[#e96b4d]/25 bg-[#e96b4d]/10 text-[#c34f38]' : 'border-stone-900/10 bg-white text-stone-400 hover:-translate-y-0.5 hover:text-[#123d3a]',
          )}
        >
          {isFavorited ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
        </button>
      </header>

      <QuestionVisual svg={question.visualsSvgContent} className="my-6" />

      {question.questionParagraph && question.questionParagraph !== 'null' && (
        <div className="my-6 max-h-72 overflow-auto rounded-2xl border border-stone-900/10 bg-[#f5f2e9] p-5 text-[15px] leading-7 text-stone-700">
          <MathRenderer text={question.questionParagraph} />
        </div>
      )}

      <div className="py-7 sm:py-9">
        <h2 className="font-display text-[clamp(1.65rem,3.5vw,2.45rem)] font-semibold leading-[1.18] tracking-[-.025em] text-stone-900">
          <MathRenderer text={question.questionText || ''} />
        </h2>
      </div>

      <div role="radiogroup" aria-label="Answer choices" className="grid gap-3">
        {options.map(option => {
          const selected = selectedAnswer === option.key;
          const correct = showAnswer && answerResult?.correctAnswer === option.key;
          const incorrect = showAnswer && selected && !correct;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={showAnswer || submitting}
              onClick={() => onAnswerSelect(option.key)}
              className={cn(
                'group grid min-h-16 w-full grid-cols-[42px_minmax(0,1fr)_24px] items-center gap-3 rounded-2xl border p-3 text-left transition-all sm:min-h-20 sm:grid-cols-[48px_minmax(0,1fr)_26px] sm:p-4',
                !showAnswer && !selected && 'border-stone-900/10 bg-white hover:-translate-y-0.5 hover:border-teal-800/35 hover:shadow-lg',
                !showAnswer && selected && 'border-teal-800 bg-teal-50 shadow-[0_10px_30px_rgba(17,94,89,.1)]',
                correct && 'border-emerald-500 bg-emerald-50',
                incorrect && 'border-red-400 bg-red-50',
                showAnswer && !correct && !incorrect && 'border-stone-900/8 bg-stone-50 opacity-60',
              )}
            >
              <span className={cn(
                'grid size-10 place-items-center rounded-xl text-xs font-extrabold transition-colors sm:size-12',
                selected ? 'bg-[#123d3a] text-white' : 'bg-stone-100 text-stone-600 group-hover:bg-teal-800/10 group-hover:text-teal-900',
                correct && '!bg-emerald-600 !text-white',
                incorrect && '!bg-red-500 !text-white',
              )}>{option.key}</span>
              <span className="min-w-0 text-sm font-semibold leading-6 text-stone-700 sm:text-[15px]"><MathRenderer text={option.value} /></span>
              <span aria-hidden="true">{correct ? <CheckCircle2 className="text-emerald-600" size={22} /> : incorrect ? <XCircle className="text-red-500" size={22} /> : null}</span>
            </button>
          );
        })}
      </div>

      {!showAnswer && (
        <div className="mt-7 flex flex-col gap-3 border-t border-stone-900/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-stone-500">{guestAccess.signedIn ? 'Choose one answer. Your first response shapes the next review date.' : 'Choose one answer. Guest results are checked without creating history.'}</p>
          <Button
            size="lg"
            disabled={!selectedAnswer || submitting}
            className="sm:min-w-44"
            onClick={() => {
              prepareFeedbackAudio();
              onSubmitAnswer();
            }}
          >{submitting ? (guestAccess.signedIn ? 'Saving…' : 'Checking…') : submitLabel}</Button>
        </div>
      )}

      {showAnswer && answerResult && (
        <section aria-live="polite" className={cn('mt-7 rounded-[1.5rem] border p-5 sm:p-6', answerResult.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
          <div className="flex items-start gap-3">
            <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl text-white', answerResult.isCorrect ? 'bg-emerald-600' : 'bg-red-500')}>
              {answerResult.isCorrect ? <CheckCircle2 size={21} /> : <XCircle size={21} />}
            </span>
            <div>
              <h3 className="font-display text-2xl font-semibold text-stone-900">{answerResult.isCorrect ? 'Matches the provided key.' : 'Different from the provided key.'}</h3>
              <p className="mt-1 text-sm text-stone-600">You chose {answerResult.userAnswer}. The provided key is <strong>{answerResult.correctAnswer}</strong>.</p>
            </div>
          </div>

          {answerResult.explanation && answerResult.explanation !== 'null' && (
            <div className="mt-5 rounded-2xl border border-white/80 bg-white/75 p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.15em] text-[#123d3a]"><Lightbulb size={16} /> Provided explanation</div>
              <div className="text-sm leading-7 text-stone-700"><MathRenderer text={answerResult.explanation} /></div>
            </div>
          )}
        </section>
      )}

      {showAnswer && answerResult && !answerResult.isCorrect && (
        <section aria-label="Mistake reflection" className="mt-4 rounded-[1.5rem] border border-[#e96b4d]/20 bg-[#fff4ef] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#bd4e39]">One-minute repair</p>
              <h3 className="mt-1 font-display text-2xl font-semibold text-stone-900">What got in the way?</h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">{guestAccess.signedIn ? 'One tap saves the closest cause to your Mistake Lab. This is your reflection, not an automated diagnosis.' : 'Choose a cause to preview the reflection tool. Sign in when you want to save it to Mistake Lab.'}</p>
            </div>
            {reflectionState === 'saved' && <p role="status" className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800"><CheckCircle2 size={14} /> Saved</p>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Reason for this mistake">
            {mistakeReasonOptions.map(option => (
              <button
                key={option.value}
                type="button"
                title={option.description}
                aria-pressed={reflectionReason === option.value}
                disabled={reflectionSaving}
                onClick={() => chooseReflectionReason(option.value)}
                className={cn(
                  'rounded-full border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/15 disabled:opacity-60',
                  reflectionReason === option.value
                    ? 'border-teal-800 bg-teal-800 text-white'
                    : 'border-stone-900/10 bg-white/85 text-stone-600 hover:border-teal-800/35 hover:text-teal-900',
                )}
              >{option.shortLabel}</button>
            ))}
          </div>

          <button
            type="button"
            aria-expanded={reflectionExpanded}
            onClick={() => setReflectionExpanded(value => !value)}
            className="mt-4 flex items-center gap-1.5 rounded-lg text-xs font-extrabold text-teal-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/15"
          >
            {reflectionExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            Add confidence or a note
          </button>

          {reflectionExpanded && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-white bg-white/65 p-4 sm:grid-cols-[180px_minmax(0,1fr)]">
              <fieldset>
                <legend className="text-xs font-bold text-stone-700">Confidence <span className="font-normal text-stone-400">(optional)</span></legend>
                <div className="mt-2 grid grid-cols-5 gap-1" role="radiogroup" aria-label="Confidence from one to five">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={reflectionConfidence === value}
                      aria-label={`Confidence ${value} of 5`}
                      onClick={() => { setReflectionConfidence(value); setReflectionState('idle'); }}
                      className={cn(
                        'h-9 rounded-lg border text-xs font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/15',
                        reflectionConfidence === value ? 'border-[#e96b4d] bg-[#e96b4d] text-white' : 'border-stone-900/10 bg-white text-stone-500',
                      )}
                    >{value}</button>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[9px] font-bold text-stone-400"><span>Guess</span><span>Certain</span></div>
              </fieldset>
              <label className="grid gap-2 text-xs font-bold text-stone-700">
                Cue for next time <span className="font-normal text-stone-400">(optional)</span>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={reflectionNote}
                  placeholder="A rule, signal word, or step to remember"
                  onChange={event => { setReflectionNote(event.target.value); setReflectionState('idle'); }}
                  className="w-full resize-y rounded-xl border border-stone-900/10 bg-white px-3 py-2 text-sm font-normal leading-6 text-stone-700 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                />
              </label>
              <div className="sm:col-span-2">
                <Button size="sm" disabled={reflectionSaving || reflectionReason === 'UNCLASSIFIED'} onClick={() => void saveReflection()}>
                  {reflectionSaving ? 'Saving…' : 'Save cue'}
                </Button>
              </div>
            </div>
          )}

          {reflectionState === 'error' && <p role="alert" className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-red-700"><AlertCircle className="mt-0.5 shrink-0" size={14} /> Reflection could not be saved. Your practice can continue; try again when ready.</p>}
        </section>
      )}

      {showAnswer && answerResult && (
        <QuestionReportPanel key={question.id} questionId={question.id} className="mt-4" />
      )}
      <SignInPromptModal open={signInOpen} onClose={() => setSignInOpen(false)} reason="save" />
    </article>
  );
}
