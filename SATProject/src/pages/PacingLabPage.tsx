import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Empty, Spin, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Clock3,
  Flag,
  Gauge,
  NotebookPen,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Timer,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import MathRenderer from '../components/MathRenderer';
import QuestionVisual from '../components/QuestionVisual';
import QuestionReportPanel from '../components/QuestionReportPanel';
import { cn } from '../lib/utils';
import { SatService } from '../services/satService';
import type { AnswerResponse, SatQuestion } from '../types/sat';
import { getDomainDisplayName } from '../utils/domainMapping';

type PacingPhase = 'setup' | 'loading' | 'running' | 'submitting' | 'results';

interface SessionPreset {
  key: string;
  label: string;
  detail: string;
  minutes: number;
  internalCount: number;
}

interface PacingResult {
  question: SatQuestion;
  selectedAnswer: string;
  responseTimeMs: number;
  result: AnswerResponse;
}

const PRESETS: SessionPreset[] = [
  { key: 'quick', label: 'Quick reset', detail: 'A short pulse check for a busy day.', minutes: 8, internalCount: 5 },
  { key: 'focus', label: 'Focused module', detail: 'Enough time to reveal a pacing pattern.', minutes: 15, internalCount: 8 },
  { key: 'endurance', label: 'Endurance block', detail: 'A longer rehearsal for steady decision-making.', minutes: 25, internalCount: 12 },
];

const createId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

const formatClock = (seconds: number) => {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

const optionsFor = (question: SatQuestion) => [
  { key: 'A', value: question.choiceA },
  { key: 'B', value: question.choiceB },
  { key: 'C', value: question.choiceC },
  { key: 'D', value: question.choiceD },
].filter((option): option is { key: string; value: string } => Boolean(option.value));

export default function PacingLabPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<PacingPhase>('setup');
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState(searchParams.get('domain') || '');
  const [preset, setPreset] = useState(PRESETS[1]);
  const [questions, setQuestions] = useState<SatQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [eliminated, setEliminated] = useState<Record<number, string[]>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [paused, setPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(preset.minutes * 60);
  const [timeExpired, setTimeExpired] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [results, setResults] = useState<PacingResult[]>([]);
  const [submitFailures, setSubmitFailures] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(createId('pacing-session'));
  const responseTimesRef = useRef<Record<number, number>>({});
  const submissionIdsRef = useRef<Record<number, string>>({});
  const activeSinceRef = useRef(Date.now());
  const finishPanelRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[index];

  useEffect(() => {
    SatService.getAllDomains().then(setDomains).catch(() => setDomains([]));
  }, []);

  useEffect(() => {
    if (phase !== 'running' || paused) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds(previous => {
        if (previous <= 1) {
          if (currentQuestion) {
            const elapsed = Math.max(0, Date.now() - activeSinceRef.current);
            responseTimesRef.current[currentQuestion.id] = (responseTimesRef.current[currentQuestion.id] || 0) + elapsed;
            activeSinceRef.current = Date.now();
          }
          setPaused(true);
          setTimeExpired(true);
          setConfirmFinish(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentQuestion, paused, phase]);

  useEffect(() => {
    if (phase !== 'running' || paused || !currentQuestion) return;
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT' || target?.tagName === 'SELECT') return;
      const key = event.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        event.preventDefault();
        if (!(eliminated[currentQuestion.id] || []).includes(key)) {
          setAnswers(previous => ({ ...previous, [currentQuestion.id]: key }));
        }
      } else if (key === 'F') {
        event.preventDefault();
        setFlagged(previous => previous.includes(currentQuestion.id)
          ? previous.filter(id => id !== currentQuestion.id)
          : [...previous, currentQuestion.id]);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  });

  useEffect(() => {
    if (phase === 'running' && paused) finishPanelRef.current?.focus();
  }, [confirmFinish, paused, phase, timeExpired]);

  const commitActiveTime = () => {
    if (!currentQuestion || phase !== 'running' || paused) return;
    const elapsed = Math.max(0, Date.now() - activeSinceRef.current);
    responseTimesRef.current[currentQuestion.id] = (responseTimesRef.current[currentQuestion.id] || 0) + elapsed;
    activeSinceRef.current = Date.now();
  };

  const moveTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    commitActiveTime();
    setIndex(nextIndex);
    activeSinceRef.current = Date.now();
  };

  const startSession = async () => {
    setPhase('loading');
    setLoadError(null);
    try {
      const nextQuestions = selectedDomain
        ? await SatService.getQuestionsByDomain(selectedDomain, preset.internalCount)
        : await SatService.getRandomQuestions(preset.internalCount);
      if (!nextQuestions.length) throw new Error('No quality-screened material is available for this setup. Try a different domain.');
      setQuestions(nextQuestions);
      setIndex(0);
      setAnswers({});
      setEliminated({});
      setFlagged([]);
      setNotes({});
      setResults([]);
      setSubmitFailures(0);
      setPaused(false);
      setTimeExpired(false);
      setConfirmFinish(false);
      setRemainingSeconds(preset.minutes * 60);
      setSessionId(createId('pacing-session'));
      responseTimesRef.current = {};
      submissionIdsRef.current = Object.fromEntries(nextQuestions.map(question => [question.id, createId(`pacing-${question.id}`)]));
      activeSinceRef.current = Date.now();
      setPhase('running');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'The pacing session could not be prepared.');
      setPhase('setup');
    }
  };

  const togglePause = () => {
    if (!paused) commitActiveTime();
    setPaused(value => !value);
    activeSinceRef.current = Date.now();
  };

  const toggleFlag = () => {
    if (!currentQuestion) return;
    setFlagged(previous => previous.includes(currentQuestion.id)
      ? previous.filter(id => id !== currentQuestion.id)
      : [...previous, currentQuestion.id]);
  };

  const askToFinish = () => {
    if (!paused) commitActiveTime();
    setPaused(true);
    setConfirmFinish(true);
  };

  const toggleElimination = (choice: string) => {
    if (!currentQuestion) return;
    const current = eliminated[currentQuestion.id] || [];
    const next = current.includes(choice) ? current.filter(key => key !== choice) : [...current, choice];
    setEliminated(previous => ({ ...previous, [currentQuestion.id]: next }));
    if (next.includes(answers[currentQuestion.id])) {
      setAnswers(previous => {
        const copy = { ...previous };
        delete copy[currentQuestion.id];
        return copy;
      });
    }
  };

  const finishSession = async () => {
    if (phase !== 'running') return;
    commitActiveTime();
    setPhase('submitting');
    setConfirmFinish(false);
    const answered = questions.filter(question => answers[question.id]);
    const settled = await Promise.allSettled(answered.map(async question => {
      const selectedAnswer = answers[question.id];
      const responseTimeMs = Math.max(0, responseTimesRef.current[question.id] || 0);
      const result = await SatService.submitAnswerWithRecord({
        questionId: question.id,
        answer: selectedAnswer,
        sessionId,
        submissionId: submissionIdsRef.current[question.id] || createId(`pacing-${question.id}`),
        studyMode: 'pacing',
        responseTimeMs,
      });
      return { question, selectedAnswer, responseTimeMs, result } satisfies PacingResult;
    }));

    const completed = settled.flatMap(item => item.status === 'fulfilled' ? [item.value] : []);
    const failures = settled.length - completed.length;
    setResults(completed);
    setSubmitFailures(failures);
    if (failures) message.warning('Some answers could not be synced. Your visible session results are still available.');
    setPhase('results');
  };

  const reset = () => {
    setPhase('setup');
    setQuestions([]);
    setResults([]);
    setLoadError(null);
    setConfirmFinish(false);
    setTimeExpired(false);
  };

  const selectedCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, questions.length - selectedCount);
  const correctCount = results.filter(item => item.result.isCorrect).length;
  const accuracy = results.length ? Math.round((correctCount / results.length) * 100) : 0;
  const averageTimeMs = results.length
    ? Math.round(results.reduce((sum, item) => sum + item.responseTimeMs, 0) / results.length)
    : 0;
  const targetPerItemMs = questions.length ? (preset.minutes * 60000) / questions.length : 0;
  const onPace = results.filter(item => item.responseTimeMs <= targetPerItemMs).length;
  const slowest = useMemo(() => [...results].sort((a, b) => b.responseTimeMs - a.responseTimeMs).slice(0, 3), [results]);

  if (phase === 'setup' || phase === 'loading') {
    return (
      <div className="page-shell pb-12">
        <section className="grid gap-8 rounded-[2.2rem] bg-[#f0e6d2] p-7 sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:p-12">
          <div>
            <p className="page-kicker flex items-center gap-2"><Gauge size={15} /> Pacing Lab</p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.9rem,7vw,5.6rem)] font-semibold leading-[.94] tracking-[-.045em] text-stone-900">Train the clock without <em className="font-light text-teal-800">chasing it.</em></h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">An original timed practice environment for separating skill gaps from pacing decisions. It is not an official SAT administration or score prediction.</p>
          </div>
          <Card className="bg-[#173c39] p-7 text-white sm:p-8">
            <Timer size={28} className="text-[#f2ad98]" />
            <h2 className="mt-8 font-display text-3xl font-semibold">What this measures</h2>
            <div className="mt-5 space-y-3 text-sm text-white/65">
              <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#e6d8bb]" /> How steadily you move through a timed block.</p>
              <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#e6d8bb]" /> Where slower reasoning overlaps with mistakes.</p>
              <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#e6d8bb]" /> Which domain deserves the next focused session.</p>
            </div>
          </Card>
        </section>

        {loadError && <Alert className="mt-5" type="warning" showIcon message="This setup is not available" description={loadError} />}

        <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_.72fr]">
          <Card className="p-6 sm:p-8">
            <p className="page-kicker">Session style</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {PRESETS.map(option => (
                <button key={option.key} type="button" aria-pressed={preset.key === option.key} onClick={() => setPreset(option)} className={cn('rounded-2xl border p-4 text-left transition-all', preset.key === option.key ? 'border-[#123d3a] bg-teal-50 shadow-[0_10px_30px_rgba(18,61,58,.08)]' : 'border-stone-900/10 bg-white hover:border-teal-800/35')}>
                  <strong className="block text-sm text-stone-900">{option.label}</strong>
                  <span className="mt-1 block text-xs text-stone-500">{option.minutes} minutes</span>
                  <span className="mt-3 block text-[11px] leading-5 text-stone-500">{option.detail}</span>
                </button>
              ))}
            </div>

            <label className="mt-6 grid gap-2 text-sm font-bold text-stone-700">Focus domain
              <select value={selectedDomain} onChange={event => setSelectedDomain(event.target.value)} className="h-12 rounded-xl border border-stone-900/15 bg-white px-3 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-800/8">
                <option value="">Mixed domains</option>
                {domains.map(domain => <option key={domain} value={domain}>{getDomainDisplayName(domain)}</option>)}
              </select>
            </label>
          </Card>

          <Card className="flex flex-col justify-between bg-[#fffdf8] p-6 sm:p-8">
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e96b4d] text-white"><Sparkles size={21} /></span>
              <h2 className="mt-7 font-display text-3xl font-semibold">Ready to rehearse?</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">Use A–D to answer and F to flag. Previous, Next, and the navigator move between prompts. You can pause if real life interrupts.</p>
            </div>
            <Button size="lg" className="mt-8 w-full" disabled={phase === 'loading'} onClick={() => void startSession()}>{phase === 'loading' ? <RefreshCw size={17} className="animate-spin" /> : <CirclePlay size={18} />} {phase === 'loading' ? 'Preparing…' : 'Start pacing session'}</Button>
          </Card>
        </section>
      </div>
    );
  }

  if (phase === 'submitting') {
    return <div className="page-shell grid min-h-[70vh] place-items-center"><div className="text-center"><Spin size="large" /><h1 className="mt-5 font-display text-3xl font-semibold">Building your pacing review…</h1><p className="mt-2 text-sm text-stone-500">Saving the attempt record and separating speed from accuracy.</p></div></div>;
  }

  if (phase === 'results') {
    return (
      <div className="page-shell pb-12">
        <section className="relative overflow-hidden rounded-[2.2rem] bg-[#173c39] p-7 text-white sm:p-10">
          <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full border-[52px] border-white/5" />
          <div className="relative">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#f2ad98]"><BarChart3 size={15} /> Pacing review</p>
            <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,5rem)] font-medium leading-none">A useful signal—not a predicted score.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">Use this result to choose the next practice mode. Official Bluebook results remain the best benchmark for test readiness.</p>
          </div>
        </section>

        {submitFailures > 0 && <Alert className="mt-5" type="warning" showIcon message="Some attempt records are waiting to sync" description="The review below includes only answers confirmed by the server." />}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="metric-card metric-coral p-6 text-white"><p className="text-xs font-bold text-white/65">Accuracy signal</p><strong className="mt-2 block font-display text-5xl">{accuracy}%</strong><p className="mt-2 text-xs text-white/55">Inside this practice simulation</p></Card>
          <Card className="metric-card metric-teal p-6 text-white"><p className="text-xs font-bold text-white/65">Average pace</p><strong className="mt-2 block font-display text-5xl">{Math.round(averageTimeMs / 1000)}s</strong><p className="mt-2 text-xs text-white/55">Per answered item</p></Card>
          <Card className="metric-card metric-ochre p-6 text-white"><p className="text-xs font-bold text-white/65">Within target pace</p><strong className="mt-2 block font-display text-5xl">{results.length ? Math.round((onPace / results.length) * 100) : 0}%</strong><p className="mt-2 text-xs text-white/55">Based on this session clock</p></Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
          <Card className="p-6 sm:p-8">
            <p className="page-kicker">Slowest decisions</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Where the clock collected</h2>
            <div className="mt-6 space-y-3">
              {slowest.length ? slowest.map(item => (
                <button
                  key={item.question.id}
                  type="button"
                  onClick={() => navigate(item.result.isCorrect
                    ? `/sat-practice?domain=${encodeURIComponent(item.question.domain || '')}`
                    : '/mistakes')}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-stone-900/10 bg-white p-4 text-left hover:border-teal-800/35"
                >
                  <span>
                    <strong className="block text-sm">{getDomainDisplayName(item.question.domain || '')}</strong>
                    <span className="mt-1 block text-xs text-stone-400">{item.result.isCorrect ? 'Practise this domain with less clock pressure' : 'Review the reasoning in Mistake Lab'}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-extrabold text-stone-600">{Math.round(item.responseTimeMs / 1000)}s</span>
                </button>
              )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Pace appears after an answered session." />}
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <p className="page-kicker">Answer review</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Turn the result into a next action</h2>
            <div className="mt-6 max-h-[34rem] space-y-3 overflow-auto pr-1">
              {results.map((item, resultIndex) => (
                <details key={item.question.id} className={cn('rounded-2xl border p-4', item.result.isCorrect ? 'border-emerald-200 bg-emerald-50/70' : 'border-red-200 bg-red-50/70')}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-bold">
                    <span className={cn('grid size-8 place-items-center rounded-xl text-white', item.result.isCorrect ? 'bg-emerald-600' : 'bg-red-500')}>{item.result.isCorrect ? <CheckCircle2 size={17} /> : <XCircle size={17} />}</span>
                    <span className="min-w-0 flex-1 truncate">Decision {resultIndex + 1} · {getDomainDisplayName(item.question.domain || '')}</span>
                    <span className="text-xs text-stone-400">{Math.round(item.responseTimeMs / 1000)}s</span>
                  </summary>
                  <div className="mt-4 border-t border-stone-900/8 pt-4 text-sm leading-6 text-stone-700">
                    <p><strong>Your answer:</strong> {item.selectedAnswer} · <strong>Provided key:</strong> {item.result.correctAnswer}</p>
                    {item.result.explanation && <div className="mt-3 rounded-xl bg-white/70 p-4"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Provided explanation</p><MathRenderer text={item.result.explanation} /></div>}
                    {notes[item.question.id] && <p className="mt-3 text-xs text-stone-500"><strong>Your note:</strong> {notes[item.question.id]}</p>}
                    <QuestionReportPanel questionId={item.question.id} className="mt-3 bg-white/70" />
                  </div>
                </details>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/mistakes')}>Open Mistake Lab <ArrowRight size={17} /></Button>
              <Button variant="secondary" onClick={() => navigate('/exam-coach')}>Rebalance my plan</Button>
              <Button variant="secondary" onClick={reset}><RotateCcw size={16} /> Try another session</Button>
            </div>
          </Card>
        </section>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="page-shell"><Empty description="The pacing session has no available material." /></div>;
  }

  const currentOptions = optionsFor(currentQuestion);
  const currentEliminated = eliminated[currentQuestion.id] || [];
  const currentFlagged = flagged.includes(currentQuestion.id);

  return (
    <div className="page-shell pb-12">
      <header className="sticky top-0 z-30 -mx-3 mb-5 rounded-b-[1.7rem] border border-stone-900/10 bg-[#fffdf8]/94 px-4 py-3 shadow-[0_16px_45px_rgba(31,41,39,.08)] backdrop-blur-xl sm:mx-0 sm:rounded-[1.7rem] sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={cn('grid size-11 place-items-center rounded-2xl', remainingSeconds < 120 ? 'bg-red-100 text-red-700' : 'bg-[#173c39] text-white')}><Clock3 size={20} /></span>
            <div><p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Practice clock</p><strong className="font-display text-2xl tabular-nums">{formatClock(remainingSeconds)}</strong></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={togglePause}>{paused ? <CirclePlay size={16} /> : <CirclePause size={16} />} {paused ? 'Resume' : 'Pause'}</Button>
            <Button size="sm" variant="secondary" onClick={toggleFlag}><Flag size={16} className={currentFlagged ? 'fill-[#e96b4d] text-[#e96b4d]' : ''} /> {currentFlagged ? 'Flagged' : 'Flag'}</Button>
            <Button size="sm" onClick={askToFinish}>Finish</Button>
          </div>
        </div>
      </header>

      {(paused || confirmFinish) && (
        <div
          ref={finishPanelRef}
          tabIndex={-1}
          role={timeExpired ? 'alert' : 'status'}
          aria-live={timeExpired ? 'assertive' : 'polite'}
          className="mb-5 rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e96b4d]/20"
        >
          <Card className="border-[#e96b4d]/25 bg-[#fff7f3] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e96b4d] text-white">{timeExpired ? <Timer size={20} /> : confirmFinish ? <ShieldAlert size={20} /> : <CirclePause size={20} />}</span>
                <div><h2 className="font-display text-2xl font-semibold">{timeExpired ? 'Time is up.' : confirmFinish ? 'Ready to finish?' : 'The clock is paused.'}</h2><p className="mt-1 text-xs leading-5 text-stone-500">{confirmFinish ? `${unansweredCount ? 'Some prompts are unanswered. ' : ''}Submitted answers will be saved and reviewed together.` : 'Resume when you are ready. Paused time does not affect pacing.'}</p></div>
              </div>
              <div className="flex gap-2">
                {!timeExpired && <Button variant="secondary" onClick={() => { setConfirmFinish(false); if (paused) togglePause(); }}>Keep working</Button>}
                {confirmFinish && <Button onClick={() => void finishSession()}>Finish and review</Button>}
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-900/10 pb-5">
            <div><p className="page-kicker">Decision {index + 1}</p><p className="mt-1 text-xs text-stone-400">{getDomainDisplayName(currentQuestion.domain || '')}</p></div>
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">A–D answer · F flag</span>
          </div>

          <QuestionVisual svg={currentQuestion.visualsSvgContent} className="mt-6" />
          {currentQuestion.questionParagraph && currentQuestion.questionParagraph !== 'null' && <div className="mt-6 max-h-64 overflow-auto rounded-2xl bg-[#f5f2e9] p-5 text-sm leading-7 text-stone-700"><MathRenderer text={currentQuestion.questionParagraph} /></div>}
          <h1 className="py-8 font-display text-[clamp(1.7rem,3.5vw,2.5rem)] font-semibold leading-[1.2] tracking-tight text-stone-900"><MathRenderer text={currentQuestion.questionText || ''} /></h1>

          <div role="radiogroup" aria-label="Answer choices" className="grid gap-3">
            {currentOptions.map(option => {
              const isSelected = answers[currentQuestion.id] === option.key;
              const isEliminated = currentEliminated.includes(option.key);
              return (
                <div key={option.key} className={cn('grid grid-cols-[1fr_auto] items-stretch gap-2 rounded-2xl border p-1.5 transition-all', isSelected ? 'border-teal-800 bg-teal-50' : 'border-stone-900/10 bg-white', isEliminated && 'opacity-45')}>
                  <button type="button" role="radio" aria-checked={isSelected} disabled={isEliminated || paused} onClick={() => setAnswers(previous => ({ ...previous, [currentQuestion.id]: option.key }))} className="grid min-h-16 grid-cols-[42px_1fr] items-center gap-3 rounded-xl p-2 text-left sm:min-h-18">
                    <span className={cn('grid size-10 place-items-center rounded-xl text-xs font-extrabold', isSelected ? 'bg-[#123d3a] text-white' : 'bg-stone-100 text-stone-600')}>{option.key}</span>
                    <span className={cn('text-sm font-semibold leading-6 text-stone-700', isEliminated && 'line-through')}><MathRenderer text={option.value} /></span>
                  </button>
                  <button type="button" disabled={paused} aria-label={`${isEliminated ? 'Restore' : 'Eliminate'} answer ${option.key}`} onClick={() => toggleElimination(option.key)} className="my-auto mr-1 grid size-10 place-items-center rounded-xl border border-stone-900/10 text-xs font-extrabold text-stone-400 hover:bg-stone-100 hover:text-stone-700">{isEliminated ? <RotateCcw size={15} /> : <span className="line-through">{option.key}</span>}</button>
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-stone-900/10 pt-5">
            <Button variant="secondary" disabled={index === 0 || paused} onClick={() => moveTo(index - 1)}><ArrowLeft size={16} /> Previous</Button>
            <Button disabled={index === questions.length - 1 || paused} onClick={() => moveTo(index + 1)}>Next <ArrowRight size={16} /></Button>
          </div>
        </Card>

        <aside className="grid content-start gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between"><p className="text-xs font-extrabold uppercase tracking-wider text-stone-500">Navigator</p><span className="text-[10px] text-stone-400">{selectedCount} answered</span></div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((question, questionIndex) => {
                const selected = questionIndex === index;
                const answered = Boolean(answers[question.id]);
                const isFlagged = flagged.includes(question.id);
                return <button key={question.id} type="button" disabled={paused} onClick={() => moveTo(questionIndex)} aria-label={`Go to decision ${questionIndex + 1}${isFlagged ? ', flagged' : ''}${answered ? ', answered' : ''}`} className={cn('relative grid aspect-square place-items-center rounded-xl border text-xs font-extrabold', selected ? 'border-[#123d3a] bg-[#123d3a] text-white' : answered ? 'border-teal-700/25 bg-teal-50 text-teal-900' : 'border-stone-900/10 bg-white text-stone-500')}>
                  {questionIndex + 1}{isFlagged && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#e96b4d]" />}
                </button>;
              })}
            </div>
          </Card>

          <Card className="p-5">
            <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-stone-500"><NotebookPen size={15} /> Scratch note</label>
            <textarea value={notes[currentQuestion.id] || ''} disabled={paused} maxLength={600} onChange={event => setNotes(previous => ({ ...previous, [currentQuestion.id]: event.target.value }))} placeholder="Record a formula, trap, or decision to revisit…" className="mt-3 min-h-32 w-full resize-y rounded-xl border border-stone-900/10 bg-stone-50 p-3 text-sm leading-6 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-800/8" />
            <p className="mt-2 text-[10px] leading-4 text-stone-400">Notes stay with this on-screen review only and are not used as readiness evidence.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
