import { useEffect, useMemo, useState } from 'react';
import { Alert, Empty, Progress, Spin, message } from 'antd';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Brain,
  CalendarDays,
  Check,
  Clock3,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LearningCoachService } from '../services/learningCoachService';
import { ReviewService } from '../services/reviewService';
import type { ReviewSummary } from '../types/review';
import type {
  DomainReadiness,
  EvidenceLevel,
  LearningProfile,
  Weekday,
} from '../types/learningCoach';
import { getDomainDisplayName } from '../utils/domainMapping';
import { GuestTrialBanner, SignInPromptModal } from '../components/guest';
import { useGuestAccess } from '../hooks/useGuestAccess';

const WEEKDAYS: Array<{ key: Weekday; short: string }> = [
  { key: 'MONDAY', short: 'Mon' },
  { key: 'TUESDAY', short: 'Tue' },
  { key: 'WEDNESDAY', short: 'Wed' },
  { key: 'THURSDAY', short: 'Thu' },
  { key: 'FRIDAY', short: 'Fri' },
  { key: 'SATURDAY', short: 'Sat' },
  { key: 'SUNDAY', short: 'Sun' },
];

const DEFAULT_PROFILE: LearningProfile = {
  testDate: null,
  targetScore: null,
  baselineScore: null,
  availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  dailyMinutes: 25,
};

const EVIDENCE_STYLES: Record<EvidenceLevel, string> = {
  LOW: 'border-amber-300/70 bg-amber-50 text-amber-800',
  MEDIUM: 'border-sky-300/70 bg-sky-50 text-sky-800',
  HIGH: 'border-emerald-300/70 bg-emerald-50 text-emerald-800',
};

const evidenceRank: Record<EvidenceLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const weekdayForDate = (date: Date): Weekday => WEEKDAYS[(date.getDay() + 6) % 7].key;

interface PlanTask {
  icon: typeof Brain;
  eyebrow: string;
  title: string;
  detail: string;
  minutes: number;
  path: string;
  tone: string;
}

export default function ExamCoachPage() {
  const navigate = useNavigate();
  const guestAccess = useGuestAccess();
  const [profile, setProfile] = useState<LearningProfile>(DEFAULT_PROFILE);
  const [readiness, setReadiness] = useState<DomainReadiness[]>([]);
  const [overallEvidence, setOverallEvidence] = useState<EvidenceLevel>('LOW');
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  const loadCoach = async () => {
    if (!guestAccess.signedIn) {
      setProfile(DEFAULT_PROFILE);
      setReadiness([]);
      setOverallEvidence('LOW');
      setReviewSummary(null);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    const [profileResult, readinessResult, reviewResult] = await Promise.allSettled([
      LearningCoachService.getProfile(),
      LearningCoachService.getReadiness(),
      ReviewService.getSummary(),
    ]);

    if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
    if (readinessResult.status === 'fulfilled') {
      setReadiness(readinessResult.value.domains);
      setOverallEvidence(readinessResult.value.overallEvidenceLevel);
    }
    if (reviewResult.status === 'fulfilled') setReviewSummary(reviewResult.value);

    const criticalError = profileResult.status === 'rejected'
      ? profileResult.reason
      : readinessResult.status === 'rejected'
        ? readinessResult.reason
        : null;
    if (criticalError) {
      setLoadError(criticalError instanceof Error ? criticalError.message : 'Your learning plan could not be loaded.');
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadCoach();
    // Authentication changes remount the correct account-backed or in-memory plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestAccess.signedIn]);

  const daysUntilTest = useMemo(() => {
    if (!profile.testDate) return null;
    const target = new Date(`${profile.testDate}T12:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));
  }, [profile.testDate]);

  const phase = daysUntilTest === null
    ? 'Build your baseline'
    : daysUntilTest > 56
      ? 'Foundation phase'
      : daysUntilTest > 21
        ? 'Skill-building phase'
        : 'Exam rehearsal phase';
  const todayAvailable = profile.availableDays.includes(weekdayForDate(new Date()));

  const readinessWithEvidence = useMemo(
    () => readiness.filter(domain => domain.attempts > 0),
    [readiness],
  );

  const focusDomain = useMemo(() => [...readinessWithEvidence].sort((a, b) => (
    evidenceRank[a.evidenceLevel] - evidenceRank[b.evidenceLevel]
    || a.accuracyPercent - b.accuracyPercent
    || (b.averageResponseTimeMs || 0) - (a.averageResponseTimeMs || 0)
  ))[0] || null, [readinessWithEvidence]);

  const tasks = useMemo<PlanTask[]>(() => {
    const available = Math.min(180, Math.max(5, profile.dailyMinutes));
    const domain = focusDomain?.domain;

    const reviewTask: PlanTask = {
      icon: Brain,
      eyebrow: 'Retention',
      title: reviewSummary?.dueNow ? 'Clear the memory queue' : 'Review ahead calmly',
      detail: reviewSummary?.dueNow
        ? 'Start with material already due so the rest of the plan stays manageable.'
        : 'A light recall pass protects earlier gains without unnecessary repetition.',
      minutes: available,
      path: '/review',
      tone: 'bg-[#123d3a] text-white',
    };
    const focusTask: PlanTask = {
      icon: Target,
      eyebrow: 'Growth area',
      title: domain ? `Strengthen ${getDomainDisplayName(domain)}` : 'Establish a practice baseline',
      detail: focusDomain
        ? 'This is the least certain part of your current evidence. The plan will change as your record grows.'
        : 'Complete a focused set so the coach can replace general guidance with personal evidence.',
      minutes: available,
      path: domain ? `/sat-practice?domain=${encodeURIComponent(domain)}&focus=coach` : '/sat-practice',
      tone: 'bg-[#e96b4d] text-white',
    };
    const pacingTask: PlanTask = {
      icon: Gauge,
      eyebrow: 'Pacing',
      title: daysUntilTest !== null && daysUntilTest <= 21 ? 'Rehearse under time' : 'Build a steady pace',
      detail: 'Use a short original simulation to separate knowledge gaps from rushed or slow decisions.',
      minutes: available,
      path: domain ? `/pacing-lab?domain=${encodeURIComponent(domain)}` : '/pacing-lab',
      tone: 'bg-[#e6d8bb] text-stone-900',
    };

    if (available < 15) return [reviewSummary?.dueNow ? reviewTask : focusTask];

    const reviewMinutes = Math.max(5, Math.floor(available * .3));
    const paceMinutes = Math.max(5, Math.floor(available * .25));
    const focusMinutes = available - reviewMinutes - paceMinutes;
    return [
      { ...reviewTask, minutes: reviewMinutes },
      { ...focusTask, minutes: focusMinutes },
      { ...pacingTask, minutes: paceMinutes },
    ];
  }, [daysUntilTest, focusDomain, profile.dailyMinutes, reviewSummary?.dueNow]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const weekday = weekdayForDate(date);
    return {
      date,
      key: dateKey(date),
      weekday,
      active: profile.availableDays.includes(weekday),
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      day: date.getDate(),
    };
  }), [profile.availableDays]);

  const toggleDay = (day: Weekday) => {
    setProfile(current => {
      const selected = current.availableDays.includes(day);
      if (selected && current.availableDays.length === 1) return current;
      return {
        ...current,
        availableDays: selected
          ? current.availableDays.filter(value => value !== day)
          : [...current.availableDays, day],
      };
    });
  };

  const saveProfile = async () => {
    if (!guestAccess.signedIn) {
      setSignInOpen(true);
      return;
    }
    setSaving(true);
    try {
      const saved = await LearningCoachService.saveProfile(profile);
      setProfile(saved);
      message.success('Your Exam Coach plan has been rebalanced.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Your plan settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-shell grid min-h-[70vh] place-items-center"><div className="text-center"><Spin size="large" /><p className="mt-4 text-sm text-stone-500">Balancing your study plan…</p></div></div>;
  }

  return (
    <div className="page-shell pb-12">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-[#173c39] p-7 text-white shadow-[0_28px_80px_rgba(23,60,57,.2)] sm:p-10 lg:p-12">
        <div aria-hidden="true" className="absolute -right-20 -top-28 size-80 rounded-full border-[58px] border-white/5" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#f2ad98]"><Sparkles size={15} /> Adaptive Exam Coach</p>
            <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.8rem,7vw,5.6rem)] font-medium leading-[.92] tracking-[-.045em]">Know what to do <em className="font-light text-[#e6d8bb]">today.</em></h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">A living plan that combines recall, skill growth, and pacing. It adapts to your deadline and your own evidence—not a claimed official score.</p>
          </div>
          <div className="grid min-w-56 gap-3 rounded-[1.6rem] border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4"><span className="text-xs text-white/55">Current phase</span><TimerReset size={17} className="text-[#f2ad98]" /></div>
            <strong className="font-display text-2xl font-semibold">{phase}</strong>
            <span className="text-xs text-white/55">{daysUntilTest === null ? 'Set a date to unlock deadline-aware pacing.' : `${daysUntilTest} days to your selected date`}</span>
          </div>
        </div>
      </section>

      {!guestAccess.signedIn && <GuestTrialBanner alwaysShow className="mt-5" />}

      {loadError && <Alert className="mt-5" type="warning" showIcon message="Some planning evidence is temporarily unavailable" description={loadError} action={<Button size="sm" onClick={() => void loadCoach()}><RefreshCw size={15} /> Retry</Button>} />}

      <section className="py-9">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="page-kicker">Your next move</p><h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">{todayAvailable ? 'Today’s balanced plan' : 'Next active-day plan'}</h2></div>
          <span className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${EVIDENCE_STYLES[overallEvidence]}`}><ShieldCheck size={13} className="mr-1 inline" /> {overallEvidence.toLowerCase()} evidence</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {tasks.map((task, index) => {
            const Icon = task.icon;
            return (
              <motion.button key={task.eyebrow} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .08 }} onClick={() => navigate(task.path)} className="group text-left">
                <Card className="flex h-full min-h-72 flex-col justify-between p-6 transition-transform duration-300 group-hover:-translate-y-1 sm:p-7">
                  <div>
                    <span className={`grid size-12 place-items-center rounded-2xl ${task.tone}`}><Icon size={21} /></span>
                    <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.16em] text-stone-400">{task.eyebrow} · about {task.minutes} min</p>
                    <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">{task.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-stone-600">{task.detail}</p>
                  </div>
                  <span className="mt-7 inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-teal-800">Start <ArrowUpRight size={15} /></span>
                </Card>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div><p className="page-kicker">Plan settings</p><h2 className="mt-2 font-display text-3xl font-semibold">Shape the week around your life</h2></div>
            <CalendarDays className="text-[#e96b4d]" size={25} />
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-stone-700">Test date
              <input type="date" value={profile.testDate || ''} min={dateKey(new Date())} onChange={event => setProfile(current => ({ ...current, testDate: event.target.value || null }))} className="h-11 rounded-xl border border-stone-900/15 bg-white px-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-800/8" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-stone-700">Daily study time
              <input
                type="number"
                min={5}
                max={180}
                step={5}
                value={profile.dailyMinutes}
                onChange={event => setProfile(current => ({
                  ...current,
                  dailyMinutes: Math.min(180, Math.max(5, Math.round(Number(event.target.value) || 5))),
                }))}
                className="h-11 rounded-xl border border-stone-900/15 bg-white px-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-800/8"
              />
              <span className="text-xs font-normal text-stone-400">Between 5 and 180 minutes.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-stone-700">Baseline score <span className="font-normal text-stone-400">optional</span>
              <input type="number" min={400} max={1600} step={10} value={profile.baselineScore ?? ''} onChange={event => setProfile(current => ({ ...current, baselineScore: event.target.value ? Number(event.target.value) : null }))} placeholder="From an official practice test" className="h-11 rounded-xl border border-stone-900/15 bg-white px-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-800/8" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-stone-700">Target score <span className="font-normal text-stone-400">optional</span>
              <input type="number" min={400} max={1600} step={10} value={profile.targetScore ?? ''} onChange={event => setProfile(current => ({ ...current, targetScore: event.target.value ? Number(event.target.value) : null }))} placeholder="A planning target, not a prediction" className="h-11 rounded-xl border border-stone-900/15 bg-white px-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-800/8" />
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-stone-700">Available days</legend>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map(day => {
                const selected = profile.availableDays.includes(day.key);
                return <button key={day.key} type="button" aria-pressed={selected} onClick={() => toggleDay(day.key)} className={`grid min-h-11 place-items-center rounded-xl border text-xs font-extrabold transition-colors ${selected ? 'border-[#123d3a] bg-[#123d3a] text-white' : 'border-stone-900/10 bg-stone-50 text-stone-500 hover:border-teal-700/40'}`}>{day.short}</button>;
              })}
            </div>
          </fieldset>

          <Button size="lg" className="mt-7 w-full" disabled={saving} onClick={() => void saveProfile()}>{saving ? <RefreshCw size={17} className="animate-spin" /> : <Check size={17} />} {saving ? 'Rebalancing…' : guestAccess.signedIn ? 'Save and rebalance' : 'Sign in to save this plan'}</Button>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div><p className="page-kicker">Readiness map</p><h2 className="mt-2 font-display text-3xl font-semibold">Evidence, without false precision</h2></div>
            <TrendingUp className="text-teal-800" size={25} />
          </div>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-stone-500">These signals reflect your activity inside SAT-Buddy. Use an official Bluebook result as the authoritative benchmark.</p>

          <div className="mt-7 space-y-5">
            {readinessWithEvidence.length ? readinessWithEvidence.map(domain => (
              <div key={domain.domain}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-stone-800">{getDomainDisplayName(domain.domain)}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-stone-400"><Clock3 size={11} /> {domain.averageResponseTimeMs ? `${Math.round(domain.averageResponseTimeMs / 1000)} sec average pace` : 'Pace appears after timed evidence'}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${EVIDENCE_STYLES[domain.evidenceLevel]}`}>{domain.evidenceLevel.toLowerCase()} evidence</span>
                </div>
                <div className="flex items-center gap-3"><Progress percent={Math.round(domain.accuracyPercent)} showInfo={false} strokeColor="#14766e" trailColor="#e7e5e4" className="!m-0" /><span className="w-11 text-right text-xs font-extrabold text-stone-600">{Math.round(domain.accuracyPercent)}%</span></div>
              </div>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Complete a practice session to begin the readiness map." />}
          </div>
        </Card>
      </section>

      <section className="mt-5 rounded-[2rem] border border-stone-900/10 bg-[#e6d8bb]/25 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="page-kicker">Next seven days</p><h2 className="mt-2 font-display text-3xl font-semibold">A plan that leaves room for real life</h2></div>
          <p className="max-w-md text-xs leading-5 text-stone-500">Miss a day without guilt. The coach rebuilds the next visit around due memory work, current evidence, and the time remaining.</p>
        </div>
        <div className="mt-6 grid grid-cols-7 gap-2">
          {week.map((day, index) => (
            <div key={day.key} className={`min-w-0 rounded-2xl border p-2.5 text-center sm:p-4 ${day.active ? 'border-teal-800/20 bg-white text-[#123d3a]' : 'border-stone-900/5 bg-white/35 text-stone-400'}`}>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider">{day.label}</span>
              <strong className="mt-1 block font-display text-2xl">{day.day}</strong>
              <span className="mt-2 hidden text-[9px] font-bold sm:block">{day.active ? (index === 0 ? 'Today plan' : index % 3 === 0 ? 'Pace + review' : 'Skill + review') : 'Rest'}</span>
            </div>
          ))}
        </div>
      </section>
      <SignInPromptModal open={signInOpen} onClose={() => setSignInOpen(false)} reason="personalized" />
    </div>
  );
}
