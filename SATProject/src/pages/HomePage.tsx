import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpenText, Brain, CalendarRange, ChartNoAxesCombined, Gauge, LibraryBig, Mail, NotebookTabs, Search, Sparkles, Target, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ReviewService } from '../services/reviewService';
import type { ReviewSummary } from '../types/review';
import { getUserPreferences, PREFERENCES_EVENT } from '../utils/userPreferences';
import { GuestTrialBanner } from '../components/guest';
import { useGuestAccess } from '../hooks/useGuestAccess';
import { buildAuthPath } from '../services/guestTrialService';

const features = [
  { icon: CalendarRange, title: 'Exam coach', copy: 'A living plan that rebalances around your date, availability and learning evidence.', path: '/exam-coach', tone: 'bg-[#123d3a] text-white' },
  { icon: BookOpenText, title: 'Curated practice', copy: 'Focused SAT sets that adapt around what you have already completed.', path: '/sat-practice', tone: 'bg-teal-800 text-white' },
  { icon: Gauge, title: 'Pacing lab', copy: 'Separate skill gaps from rushed or slow decisions in an original timed simulation.', path: '/pacing-lab', tone: 'bg-[#e96b4d] text-white' },
  { icon: NotebookTabs, title: 'Mistake lab', copy: 'Turn misses into patterns, reflections and a specific repair action.', path: '/mistakes', tone: 'bg-[#edd6a8] text-stone-900' },
  { icon: Search, title: 'Vocabulary studio', copy: 'Look up, understand and save unfamiliar words while you study.', path: '/dictionary', tone: 'bg-[#edd6a8] text-stone-900' },
  { icon: Brain, title: 'Memory review', copy: 'Revisit each question when forgetting is most likely, not at random.', path: '/review', tone: 'bg-stone-800 text-white' },
  { icon: ChartNoAxesCombined, title: 'Visible progress', copy: 'See accuracy, activity and domain performance without digging through data.', path: '/dashboard', tone: 'bg-[#e96b4d] text-white' },
  { icon: LibraryBig, title: 'Trusted resources', copy: 'Launch official and carefully licensed learning sources without copied content.', path: '/resources', tone: 'bg-[#d7e7e3] text-teal-950' },
];

const studyPlans = [
  { key: 'quick', label: 'I have 5 minutes', title: 'Take one Daily Quick question', copy: 'A random unanswered question, with immediate marking and no setup.', path: '/sat-single', cta: 'Give me one question' },
  { key: 'practice', label: 'I have 15+ minutes', title: 'Build a focused practice set', copy: 'Choose a domain and session length for a more deliberate block of work.', path: '/sat-practice', cta: 'Set up practice' },
  { key: 'review', label: 'I want to remember', title: 'Clear today’s memory queue', copy: 'Review questions at expanding intervals so corrected mistakes have a better chance to stick.', path: '/review', cta: 'Open memory review' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const guestAccess = useGuestAccess();
  const [selectedPlan, setSelectedPlan] = useState(studyPlans[0]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [preferences, setPreferences] = useState(getUserPreferences);

  useEffect(() => {
    if (guestAccess.signedIn) ReviewService.getSummary().then(setReviewSummary).catch(() => undefined);
    else setReviewSummary(null);
    const updatePreferences = () => setPreferences(getUserPreferences());
    window.addEventListener(PREFERENCES_EVENT, updatePreferences);
    return () => window.removeEventListener(PREFERENCES_EVENT, updatePreferences);
  }, [guestAccess.signedIn]);

  return (
    <div className="page-shell overflow-hidden">
      <section className="relative grid min-h-[68vh] items-center gap-12 py-10 lg:grid-cols-[1.08fr_.92fr] lg:py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}>
          <div className="page-kicker flex items-center gap-2"><Sparkles size={14} /> Your SAT study studio</div>
          <h1 className="page-title mt-5 max-w-4xl">Study with <em className="font-light text-teal-800">direction</em>, not just repetition.</h1>
          <p className="page-subtitle mt-7 max-w-2xl">A calmer, clearer place to practise questions, understand your performance and turn new vocabulary into lasting knowledge.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate(guestAccess.signedIn ? '/exam-coach' : '/sat-practice')}>{guestAccess.signedIn ? 'Open my plan' : 'Start guest practice'} <ArrowUpRight size={18} /></Button>
            <Button size="lg" variant="secondary" onClick={() => navigate(guestAccess.signedIn ? '/dashboard' : buildAuthPath('/home'))}>{guestAccess.signedIn ? 'View my progress' : 'Sign in to save'}</Button>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-stone-900/10 pt-6 text-sm text-stone-600">
            <span><strong className="text-stone-900">{guestAccess.signedIn ? 'One account' : 'One guest set'}</strong> {guestAccess.signedIn ? 'across every mode' : 'without creating an account'}</span>
            <span><strong className="text-stone-900">{guestAccess.signedIn ? 'Memory timing' : 'No answer storage'}</strong> {guestAccess.signedIn ? 'from every answer' : 'until you choose to sign in'}</span>
            <span><strong className="text-stone-900">Quality-screened practice</strong> with honest provided-key language</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .94, rotate: 1.5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: .12, duration: .7, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-12 -z-10 rounded-full bg-teal-700/10 blur-3xl" />
          <Card className="relative overflow-hidden bg-[#173c39] p-7 text-white sm:p-10">
            <div className="absolute right-0 top-0 size-44 translate-x-12 -translate-y-12 rounded-full border-[26px] border-white/5" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-teal-50/70">Today’s focus</span>
                <Target className="text-[#f1b49f]" size={26} />
              </div>
              <p className="mt-16 font-display text-4xl font-medium leading-tight">Small sessions.<br />Measurable momentum.</p>
              <div className="mt-10 grid grid-cols-3 gap-3">
                {(guestAccess.signedIn
                  ? [[String(reviewSummary?.dueNow ?? 0), 'due now'], [String(preferences.dailyReviewGoal), 'daily goal'], [String(Math.max(1, Math.ceil((reviewSummary?.dueNow ?? 0) * 1.5))), 'minutes']]
                  : [['1', 'guest set'], ['0', 'saved answers'], ['A–D', 'instant check']]
                ).map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/7 p-4">
                    <strong className="block text-xl">{value}</strong><span className="text-[10px] uppercase tracking-wider text-teal-50/45">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {!guestAccess.signedIn && <GuestTrialBanner alwaysShow className="mb-8" />}

      <section className="grid gap-4 pb-8 md:grid-cols-2 xl:grid-cols-4">
        {features.map(({ icon: Icon, title, copy, path, tone }, index) => (
          <motion.button key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 + index * .08 }} onClick={() => navigate(path)} className="group text-left">
            <Card className="h-full p-6 transition-transform duration-300 group-hover:-translate-y-1">
              <span className={`grid size-12 place-items-center rounded-2xl ${tone}`}><Icon size={21} /></span>
              <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight text-stone-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{copy}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-teal-800">Open <ArrowUpRight size={14} /></span>
            </Card>
          </motion.button>
        ))}
      </section>

      <section className="grid gap-6 py-16 lg:grid-cols-[.72fr_1.28fr] lg:items-stretch">
        <div className="rounded-[2rem] bg-[#123d3a] p-7 text-white sm:p-9">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-[#e6d8bb]"><Zap size={15} /> Choose by time</div>
          <h2 className="mt-5 font-display text-4xl font-medium leading-none">What kind of study session fits today?</h2>
          <div className="mt-8 space-y-2">
            {studyPlans.map(plan => (
              <button
                key={plan.key}
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${selectedPlan.key === plan.key ? 'border-[#e07a5f] bg-white text-[#123d3a]' : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'}`}
              >
                {plan.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div key={selectedPlan.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="flex h-full min-h-[360px] flex-col justify-between overflow-hidden p-8 sm:p-10">
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e07a5f] text-white"><ArrowRight size={21} /></span>
              <p className="mt-12 text-xs font-extrabold uppercase tracking-[.16em] text-stone-400">Your suggested next move</p>
              <h3 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-tight tracking-tight">{selectedPlan.title}</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600">{selectedPlan.copy}</p>
            </div>
            <Button size="lg" className="mt-8 w-fit" onClick={() => navigate(selectedPlan.path)}>{selectedPlan.cta} <ArrowUpRight size={17} /></Button>
          </Card>
        </motion.div>
      </section>

      <section className="mb-8 flex flex-col justify-between gap-6 rounded-[2rem] border border-stone-900/10 bg-[#e6d8bb]/35 p-7 sm:flex-row sm:items-center sm:p-9">
        <div>
          <p className="page-kicker">By students, for students</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Built by Nick Jizheng Li</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">SAT-Buddy is a student-built project focused on making every practice answer useful, visible and easier to return to.</p>
        </div>
        <a href="mailto:nick.jizheng.li@gmail.com" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#123d3a] px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"><Mail size={16} /> Contact Nick</a>
      </section>
    </div>
  );
}
