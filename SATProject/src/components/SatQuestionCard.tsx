import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { Bookmark, BookmarkCheck, CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import type { AnswerResponse, SatQuestion } from '../types/sat';
import MathRenderer from './MathRenderer';
import { FavoriteQuestionService } from '../services/favoriteQuestionService';
import CorrectAnswerCelebration from './CorrectAnswerCelebration';
import { playCorrectAnswerChime, prepareFeedbackAudio } from '../utils/feedbackAudio';
import { getUserPreferences } from '../utils/userPreferences';
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

const sanitizeSvg = (rawSvg?: string) => {
  if (!rawSvg || rawSvg === 'null' || typeof DOMParser === 'undefined') return '';

  const document = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement.tagName.toLowerCase() !== 'svg') return '';

  document.querySelectorAll('script, foreignObject, iframe, object, embed, audio, video, link, style').forEach(node => node.remove());
  document.querySelectorAll('*').forEach(node => {
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || value.includes('javascript:') || value.includes('data:text/html')) {
        node.removeAttribute(attribute.name);
      }
      if ((name === 'href' || name === 'xlink:href') && value && !value.startsWith('#')) {
        node.removeAttribute(attribute.name);
      }
    }
  });

  return new XMLSerializer().serializeToString(document.documentElement);
};

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
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const safeSvg = useMemo(() => sanitizeSvg(question.visualsSvgContent), [question.visualsSvgContent]);

  useEffect(() => {
    let active = true;
    FavoriteQuestionService.checkFavoriteStatus(question.id)
      .then(favorited => active && setIsFavorited(favorited))
      .catch(() => undefined);
    return () => { active = false; };
  }, [question.id]);

  useEffect(() => {
    if (!showAnswer || !answerResult?.isCorrect || !celebrateOnCorrect) return;
    const preferences = getUserPreferences();
    setShowCelebration(preferences.celebrations);
    playCorrectAnswerChime();
    const timeout = window.setTimeout(() => setShowCelebration(false), 1700);
    return () => window.clearTimeout(timeout);
  }, [answerResult, celebrateOnCorrect, showAnswer]);

  const toggleFavorite = async () => {
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
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#c34f38]">Quality-screened practice</p>
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

      {safeSvg && (
        <div className="question-visual my-6 rounded-2xl border border-stone-900/10 bg-white p-4 text-center" dangerouslySetInnerHTML={{ __html: safeSvg }} />
      )}

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
          <p className="text-xs leading-5 text-stone-500">Choose one answer. Your first response shapes the next review date.</p>
          <Button
            size="lg"
            disabled={!selectedAnswer || submitting}
            className="sm:min-w-44"
            onClick={() => {
              prepareFeedbackAudio();
              onSubmitAnswer();
            }}
          >{submitting ? 'Saving…' : submitLabel}</Button>
        </div>
      )}

      {showAnswer && answerResult && (
        <section aria-live="polite" className={cn('mt-7 rounded-[1.5rem] border p-5 sm:p-6', answerResult.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
          <div className="flex items-start gap-3">
            <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl text-white', answerResult.isCorrect ? 'bg-emerald-600' : 'bg-red-500')}>
              {answerResult.isCorrect ? <CheckCircle2 size={21} /> : <XCircle size={21} />}
            </span>
            <div>
              <h3 className="font-display text-2xl font-semibold text-stone-900">{answerResult.isCorrect ? 'That’s right.' : 'Not this time.'}</h3>
              <p className="mt-1 text-sm text-stone-600">You chose {answerResult.userAnswer}. The correct answer is <strong>{answerResult.correctAnswer}</strong>.</p>
            </div>
          </div>

          {answerResult.explanation && answerResult.explanation !== 'null' && (
            <div className="mt-5 rounded-2xl border border-white/80 bg-white/75 p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.15em] text-[#123d3a]"><Lightbulb size={16} /> Why</div>
              <div className="text-sm leading-7 text-stone-700"><MathRenderer text={answerResult.explanation} /></div>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
