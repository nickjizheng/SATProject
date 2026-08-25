import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Spin } from 'antd';
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Filter,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import MathRenderer from '../components/MathRenderer';
import QuestionVisual from '../components/QuestionVisual';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LearningService } from '../services/learningService';
import type {
  MistakeFilters,
  MistakeReason,
  MistakeRecord,
  MistakeReflectionUpdate,
  MistakeSummary,
} from '../types/learning';
import { getDomainDisplayName } from '../utils/domainMapping';
import { getMistakeReasonLabel, mistakeReasonOptions } from '../utils/learningLabels';
import { cn } from '../lib/utils';

const EMPTY_SUMMARY: MistakeSummary = { unresolvedTotal: 0, byReason: [], byDomain: [] };

const formatOccurredAt = (value?: string) => {
  if (!value) return 'Recent attempt';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent attempt';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date);
};

const formatResponseTime = (milliseconds?: number | null) => {
  if (milliseconds === undefined || milliseconds === null || milliseconds < 0) return null;
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m${remainder ? ` ${remainder}s` : ''}`;
};

const normalizeConfidence = (value?: number | null) => {
  if (value === undefined || value === null) return null;
  return Math.min(5, Math.max(1, Math.round(value)));
};

interface MistakeCardProps {
  mistake: MistakeRecord;
  onUpdated: (record: MistakeRecord) => void;
}

function MistakeCard({ mistake, onUpdated }: MistakeCardProps) {
  const [reason, setReason] = useState<MistakeReason>(mistake.reason || 'UNCLASSIFIED');
  const [confidence, setConfidence] = useState<number | null>(normalizeConfidence(mistake.confidence));
  const [note, setNote] = useState(mistake.note || '');
  const [resolved, setResolved] = useState(mistake.resolved);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [expanded, setExpanded] = useState(false);
  const saveInFlight = useRef(false);

  const saveReflection = async () => {
    if (saveInFlight.current) return;
    const next: MistakeReflectionUpdate = {
      reason,
      confidence,
      note: note.trim(),
      resolved,
    };

    if (next.reason === 'UNCLASSIFIED') {
      setSaveState('error');
      return;
    }

    saveInFlight.current = true;
    setSaving(true);
    setSaveState('idle');
    try {
      const updated = await LearningService.updateMistake(mistake.questionId, next);
      setReason(updated.reason);
      setConfidence(normalizeConfidence(updated.confidence));
      setNote(updated.note || '');
      setResolved(updated.resolved);
      setSaveState('saved');
      onUpdated(updated);
    } catch {
      setSaveState('error');
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  const options = (['A', 'B', 'C', 'D'] as const)
    .map(key => ({ key, value: mistake.choices[key] }))
    .filter((option): option is { key: 'A' | 'B' | 'C' | 'D'; value: string } => Boolean(option.value));
  const responseTime = formatResponseTime(mistake.responseTimeMs);

  return (
    <Card className={cn('overflow-hidden transition-opacity', resolved && 'opacity-80')}>
      <div className="border-b border-stone-900/10 bg-white/55 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-teal-800/10 px-3 py-1.5 text-teal-900">{getDomainDisplayName(mistake.domain) || 'Mixed skill'}</span>
            <span className={cn('rounded-full px-3 py-1.5', resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-[#e96b4d]/10 text-[#a9412e]')}>
              {resolved ? 'Repaired' : getMistakeReasonLabel(mistake.reason)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500">
            {responseTime && <span className="flex items-center gap-1"><Clock3 size={13} /> {responseTime}</span>}
            <time dateTime={mistake.occurredAt}>{formatOccurredAt(mistake.occurredAt)}</time>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <div className="min-w-0 p-5 sm:p-7">
          <QuestionVisual svg={mistake.visualsSvgContent} className="mb-5" />
          {mistake.questionParagraph && mistake.questionParagraph !== 'null' && (
            <div className="mb-5 max-h-60 overflow-auto rounded-2xl border border-stone-900/10 bg-[#f5f2e9] p-4 text-sm leading-7 text-stone-700">
              <MathRenderer text={mistake.questionParagraph} />
            </div>
          )}
          <h2 className="font-display text-2xl font-semibold leading-tight text-stone-900 sm:text-3xl">
            <MathRenderer text={mistake.questionText || 'Question text unavailable'} />
          </h2>

          <div className="mt-5 grid gap-2">
            {options.map(option => {
              const selected = mistake.selectedAnswer === option.key;
              const correct = mistake.correctAnswer === option.key;
              return (
                <div
                  key={option.key}
                  className={cn(
                    'grid grid-cols-[34px_minmax(0,1fr)] items-start gap-3 rounded-xl border px-3 py-2.5 text-sm',
                    correct && 'border-emerald-200 bg-emerald-50',
                    selected && !correct && 'border-red-200 bg-red-50',
                    !selected && !correct && 'border-stone-900/8 bg-white/55',
                  )}
                >
                  <span className={cn(
                    'grid size-8 place-items-center rounded-lg text-xs font-extrabold',
                    correct ? 'bg-emerald-600 text-white' : selected ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-600',
                  )}>{option.key}</span>
                  <span className="min-w-0 pt-1 leading-6 text-stone-700"><MathRenderer text={option.value} /></span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-red-100 px-3 py-1.5 text-red-800">You chose {mistake.selectedAnswer}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">Provided key: {mistake.correctAnswer}</span>
          </div>

          {(mistake.explanation && mistake.explanation !== 'null') && (
            <div className="mt-5 rounded-2xl border border-stone-900/10 bg-white/65 p-4">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(value => !value)}
                className="flex w-full items-center justify-between gap-3 rounded-lg text-left text-xs font-extrabold uppercase tracking-[.13em] text-teal-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/15"
              >
                <span className="flex items-center gap-2"><Lightbulb size={15} /> Provided explanation</span>
                <span aria-hidden="true">{expanded ? '−' : '+'}</span>
              </button>
              {expanded && <div className="mt-3 text-sm leading-7 text-stone-700"><MathRenderer text={mistake.explanation} /></div>}
            </div>
          )}
        </div>

        <aside className="border-t border-stone-900/10 bg-[#e6d8bb]/20 p-5 sm:p-7 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#bd4e39]">Repair reflection</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-stone-900">What actually went wrong?</h3>
          <p className="mt-2 text-xs leading-5 text-stone-500">Choose the closest cause. Your answer helps organize future practice; it is not a diagnosis.</p>

          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Mistake cause">
            {mistakeReasonOptions.map(option => (
              <button
                key={option.value}
                type="button"
                aria-pressed={reason === option.value}
                title={option.description}
                onClick={() => { setReason(option.value); setSaveState('idle'); }}
                className={cn(
                  'rounded-full border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/15',
                  reason === option.value
                    ? 'border-teal-800 bg-teal-800 text-white'
                    : 'border-stone-900/10 bg-white/75 text-stone-600 hover:border-teal-800/35 hover:text-teal-900',
                )}
              >{option.shortLabel}</button>
            ))}
          </div>

          <fieldset className="mt-5">
            <legend className="text-xs font-bold text-stone-700">Confidence when you answered <span className="font-normal text-stone-400">(optional)</span></legend>
            <div className="mt-2 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Confidence from one to five">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={confidence === value}
                  aria-label={`Confidence ${value} of 5`}
                  onClick={() => { setConfidence(value); setSaveState('idle'); }}
                  className={cn(
                    'h-9 rounded-lg border text-xs font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/15',
                    confidence === value ? 'border-[#e96b4d] bg-[#e96b4d] text-white' : 'border-stone-900/10 bg-white/75 text-stone-500 hover:border-[#e96b4d]/40',
                  )}
                >{value}</button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-bold text-stone-400"><span>Guessing</span><span>Certain</span></div>
          </fieldset>

          <label className="mt-5 grid gap-2 text-xs font-bold text-stone-700">
            Note to future you <span className="font-normal text-stone-400">(optional)</span>
            <textarea
              value={note}
              maxLength={500}
              rows={3}
              placeholder="What cue, rule, or step should you remember?"
              onChange={event => { setNote(event.target.value); setSaveState('idle'); }}
              className="w-full resize-y rounded-xl border border-stone-900/10 bg-white/80 px-3 py-2.5 text-sm font-normal leading-6 text-stone-700 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            />
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-stone-900/10 bg-white/65 p-3 text-xs leading-5 text-stone-600">
            <input
              type="checkbox"
              checked={resolved}
              onChange={event => { setResolved(event.target.checked); setSaveState('idle'); }}
              className="mt-0.5 size-4 accent-teal-800"
            />
            <span><strong className="block text-stone-800">I repaired this pattern</strong>Mark it resolved when you can explain the correction or solve a similar item.</span>
          </label>

          {saveState === 'error' && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={14} /> {reason === 'UNCLASSIFIED' ? 'Choose a cause before saving.' : 'This reflection could not be saved. Try again.'}
            </p>
          )}
          {saveState === 'saved' && <p role="status" className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} /> Reflection saved</p>}

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Button disabled={saving} onClick={() => void saveReflection()}>{saving ? 'Saving…' : 'Save reflection'}</Button>
            <Button asChild variant="secondary">
              <Link to={`/sat-practice?domain=${encodeURIComponent(mistake.domain || '')}`}>Practice this domain <ArrowRight size={15} /></Link>
            </Button>
          </div>
        </aside>
      </div>
    </Card>
  );
}

export default function MistakeLabPage() {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [summary, setSummary] = useState<MistakeSummary>(EMPTY_SUMMARY);
  const [reasonFilter, setReasonFilter] = useState<MistakeReason | ''>('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const filters = useMemo<MistakeFilters>(() => ({
    reason: reasonFilter || undefined,
    domain: domainFilter || undefined,
    resolved: statusFilter === 'all' ? undefined : statusFilter === 'resolved',
    limit: 50,
  }), [domainFilter, reasonFilter, statusFilter]);

  const loadData = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setLoadError(null);
    try {
      const [nextMistakes, nextSummary] = await Promise.all([
        LearningService.getMistakes(filters),
        LearningService.getMistakeSummary(),
      ]);
      if (sequence !== requestSequence.current) return;
      setMistakes(nextMistakes);
      setSummary(nextSummary);
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setLoadError(error instanceof Error ? error.message : 'Your mistake history could not be loaded.');
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdated = (updated: MistakeRecord) => {
    setMistakes(previous => {
      const belongsInView = (filters.resolved === undefined || updated.resolved === filters.resolved)
        && (!filters.reason || updated.reason === filters.reason)
        && (!filters.domain || updated.domain === filters.domain);
      if (!belongsInView) return previous.filter(item => item.questionId !== updated.questionId);
      return previous.map(item => item.questionId === updated.questionId ? updated : item);
    });
    void LearningService.getMistakeSummary().then(setSummary).catch(() => undefined);
  };

  const classifiedPatterns = summary.byReason.filter(item => item.reason !== 'UNCLASSIFIED' && item.count > 0);
  const leadingReason = [...classifiedPatterns].sort((a, b) => b.count - a.count)[0];
  const leadingDomain = [...summary.byDomain].sort((a, b) => b.count - a.count)[0];
  const activeFilterCount = Number(Boolean(reasonFilter)) + Number(Boolean(domainFilter)) + Number(statusFilter !== 'open');

  const clearFilters = () => {
    setReasonFilter('');
    setDomainFilter('');
    setStatusFilter('open');
  };

  return (
    <div className="page-shell" id="main-content">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#173c39] px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
        <div aria-hidden="true" className="absolute -right-16 -top-20 size-72 rounded-full border-[44px] border-white/[.045]" />
        <div aria-hidden="true" className="absolute -bottom-28 left-1/3 size-64 rounded-full bg-[#e96b4d]/20 blur-3xl" />
        <div className="relative grid gap-9 lg:grid-cols-[1.12fr_.88fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#f1b49f]"><BrainCircuit size={15} /> Mistake Lab</p>
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,7vw,5.6rem)] font-medium leading-[.88] tracking-[-.05em]">
              Turn a miss into a <em className="font-light text-[#f1b49f]">repair plan.</em>
            </h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-teal-50/70 sm:text-base">
              Classify what happened, leave yourself a useful cue, and practise the same domain with more intention.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.06] p-6 backdrop-blur-sm sm:p-7">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-[#e6d8bb]"><Sparkles size={15} /> Evidence, kept honest</p>
            <p className="mt-4 text-sm leading-6 text-white/72">
              These patterns come only from your own recorded attempts and reflections. They are study signals—not an official score, diagnosis, or guarantee.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Mistake summary" className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-[#e96b4d]/10 text-[#bd4e39]"><RotateCcw size={19} /></span>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[.13em] text-stone-400">Waiting for reflection</p>
          <p className="mt-2 font-display text-4xl font-semibold text-stone-900">{summary.unresolvedTotal}</p>
          <p className="mt-2 text-xs leading-5 text-stone-500">Open misses to classify, revisit, or mark repaired.</p>
        </Card>
        <Card className="p-5 sm:p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-800/10 text-teal-800"><BrainCircuit size={19} /></span>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[.13em] text-stone-400">Leading pattern</p>
          <p className="mt-2 font-display text-3xl font-semibold text-stone-900">{leadingReason ? getMistakeReasonLabel(leadingReason.reason) : 'Still learning'}</p>
          <p className="mt-2 text-xs leading-5 text-stone-500">Based on misses you have personally classified.</p>
        </Card>
        <Card className="p-5 sm:p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-800"><Target size={19} /></span>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[.13em] text-stone-400">Current focus</p>
          <p className="mt-2 font-display text-3xl font-semibold text-stone-900">{leadingDomain ? getDomainDisplayName(leadingDomain.domain) : 'No clear pattern'}</p>
          <p className="mt-2 text-xs leading-5 text-stone-500">A direction for practice, not a claim about mastery.</p>
        </Card>
      </section>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-teal-900"><Filter size={15} /> Find a pattern</p>
            <p className="mt-1 text-xs text-stone-500">Filter the latest miss for each practice item.</p>
          </div>
          {activeFilterCount > 0 && <Button size="sm" variant="ghost" onClick={clearFilters}>Clear filters</Button>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-xs font-bold text-stone-700">
            Cause
            <select
              value={reasonFilter}
              onChange={event => setReasonFilter(event.target.value as MistakeReason | '')}
              className="h-11 rounded-xl border border-stone-900/10 bg-white/80 px-3 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            >
              <option value="">Every cause</option>
              <option value="UNCLASSIFIED">Not reflected yet</option>
              {mistakeReasonOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-bold text-stone-700">
            Domain
            <select
              value={domainFilter}
              onChange={event => setDomainFilter(event.target.value)}
              className="h-11 rounded-xl border border-stone-900/10 bg-white/80 px-3 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            >
              <option value="">Every domain</option>
              {summary.byDomain.map(item => <option key={item.domain} value={item.domain}>{getDomainDisplayName(item.domain)}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-bold text-stone-700">
            Repair status
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as 'open' | 'resolved' | 'all')}
              className="h-11 rounded-xl border border-stone-900/10 bg-white/80 px-3 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
            >
              <option value="open">Needs repair</option>
              <option value="resolved">Repaired</option>
              <option value="all">Every status</option>
            </select>
          </label>
        </div>
      </Card>

      <section aria-label="Mistake history" aria-busy={loading} className="mt-6 grid gap-5">
        {loading ? (
          <Card className="grid min-h-72 place-items-center p-8 text-center" aria-live="polite">
            <div><Spin size="large" /><p className="mt-4 text-sm font-bold text-stone-500">Finding useful patterns in your attempts…</p></div>
          </Card>
        ) : loadError ? (
          <Card className="grid min-h-64 place-items-center p-8 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-100 text-red-700"><AlertCircle size={22} /></span>
              <h2 className="mt-5 font-display text-3xl font-semibold text-stone-900">The lab could not load.</h2>
              <p role="alert" className="mt-3 text-sm leading-6 text-stone-500">{loadError}</p>
              <Button className="mt-5" onClick={() => void loadData()}><RefreshCw size={16} /> Try again</Button>
            </div>
          </Card>
        ) : mistakes.length === 0 ? (
          <Card className="grid min-h-72 place-items-center p-8 text-center">
            <div className="max-w-lg">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={25} /></span>
              <h2 className="mt-5 font-display text-3xl font-semibold text-stone-900">Nothing matches these filters.</h2>
              <div className="mt-3 text-sm leading-6 text-stone-500">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
                {activeFilterCount > 0 ? 'Clear the filters to see more of your attempt history.' : 'Missed practice items will appear here after your next recorded attempt.'}
              </div>
              {activeFilterCount > 0
                ? <Button className="mt-5" variant="secondary" onClick={clearFilters}>Clear filters</Button>
                : <Button asChild className="mt-5"><Link to="/sat-practice">Start focused practice <ArrowRight size={16} /></Link></Button>}
            </div>
          </Card>
        ) : mistakes.map(mistake => <MistakeCard key={mistake.questionId} mistake={mistake} onUpdated={handleUpdated} />)}
      </section>
    </div>
  );
}
