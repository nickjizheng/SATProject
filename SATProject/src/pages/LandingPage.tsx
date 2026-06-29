import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BookmarkCheck,
  Check,
  CheckCircle2,
  CircleUserRound,
  LibraryBig,
  Menu,
  Search,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';

const capabilities = [
  {
    icon: Target,
    number: '01',
    title: 'Focused SAT practice',
    copy: 'Choose a domain and set length, then work through non-repeating questions with immediate marking and clear explanations.',
    detail: 'Practice sets remember what you have answered, so your time goes toward new material rather than accidental repeats.',
  },
  {
    icon: Zap,
    number: '02',
    title: 'Quick-question mode',
    copy: 'Use a lighter, one-question-at-a-time flow when you only have a few minutes or want a fast daily study habit.',
    detail: 'It shares the same answer history as full practice mode, keeping your progress synchronized.',
  },
  {
    icon: BarChart3,
    number: '03',
    title: 'Progress you can read',
    copy: 'See answered questions, accuracy, recent activity, study streaks and performance broken down by SAT domain.',
    detail: 'Your dashboard turns every attempt into a practical signal about where to focus next.',
  },
  {
    icon: Search,
    number: '04',
    title: 'Built-in dictionary',
    copy: 'Look up unfamiliar words without leaving your study session and review definitions, pronunciation and part of speech.',
    detail: 'Useful results can be saved directly into a personal vocabulary collection for later review.',
  },
  {
    icon: BookmarkCheck,
    number: '05',
    title: 'A personal study library',
    copy: 'Save difficult questions and valuable words to revisit them from one organized, account-specific collection.',
    detail: 'Saved questions remain interactive, so you can practise them again instead of storing static screenshots.',
  },
  {
    icon: CircleUserRound,
    number: '06',
    title: 'Private, synced accounts',
    copy: 'Your attempts, dashboard metrics and saved items stay connected to your account across every study mode.',
    detail: 'Verification and secure password storage protect each student’s personal learning record.',
  },
];

const demoOptions = [
  { key: 'A', value: 'x = 1 and x = 6' },
  { key: 'B', value: 'x = 2 and x = 3' },
  { key: 'C', value: 'x = -2 and x = -3' },
  { key: 'D', value: 'x = 3 and x = 5' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const correct = 'B';

  const choose = (key: string) => {
    setSelected(key);
    setSubmitted(false);
  };

  return (
    <div className="marketing-canvas min-h-screen overflow-hidden bg-[#f6f2e8] text-[#1f2927]">
      <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-[#f6f2e8]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#173c39] text-[#f4d8cc]"><LibraryBig size={22} /></span>
            <span className="text-left"><strong className="block font-display text-[1.65rem] font-medium leading-none">PeakSAT</strong><small className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.22em] text-stone-500">Study studio</small></span>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-bold text-stone-600 md:flex">
            <a href="#experience" className="hover:text-teal-800">Try it</a>
            <a href="#features" className="hover:text-teal-800">Features</a>
            <a href="#workflow" className="hover:text-teal-800">How it works</a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" onClick={() => navigate('/auth?mode=login')}>Log in</Button>
            <Button onClick={() => navigate('/auth?mode=register')}>Create account <ArrowRight size={16} /></Button>
          </div>
          <button onClick={() => setMobileMenu(value => !value)} className="grid size-11 place-items-center rounded-xl border border-stone-900/10 md:hidden">{mobileMenu ? <X /> : <Menu />}</button>
        </div>
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-stone-900/10 bg-[#f6f2e8] md:hidden">
              <div className="space-y-2 p-5"><a href="#experience" className="block p-2 font-bold">Try it</a><a href="#features" className="block p-2 font-bold">Features</a><a href="#workflow" className="block p-2 font-bold">How it works</a><Button className="mt-3 w-full" onClick={() => navigate('/auth?mode=register')}>Create account</Button></div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:px-14 lg:py-28">
          <div className="absolute left-[42%] top-10 -z-0 size-[32rem] rounded-full bg-teal-700/[.07] blur-3xl" />
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="relative z-10">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#c34f38]"><Sparkles size={14} /> SAT preparation with a memory</p>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(4rem,8vw,7.8rem)] font-medium leading-[.82] tracking-[-.06em]">Practise.<br /><em className="font-light text-teal-800">Understand.</em><br />Improve.</h1>
            <p className="mt-9 max-w-xl text-lg leading-8 text-stone-600">PeakSAT brings question practice, answer feedback, progress analytics and vocabulary tools into one calm workspace, so every session builds on the last.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Button size="lg" onClick={() => document.querySelector('#experience')?.scrollIntoView({ behavior: 'smooth' })}>Try a sample question <ArrowRight size={18} /></Button><Button size="lg" variant="secondary" onClick={() => navigate('/auth?mode=login')}>I already have an account</Button></div>
            <div className="mt-10 flex flex-wrap gap-6 text-xs font-bold uppercase tracking-wider text-stone-500"><span className="flex items-center gap-2"><Check size={15} className="text-teal-700" /> Free to explore</span><span className="flex items-center gap-2"><Check size={15} className="text-teal-700" /> No login for the demo</span></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 28, rotate: 1 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ delay: .12, duration: .7 }} className="relative z-10">
            <Card className="overflow-hidden bg-[#173c39] p-5 text-white sm:p-8">
              <div className="flex items-center justify-between"><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-white/60">A connected study loop</span><BookOpenCheck className="text-[#f1b49f]" /></div>
              <div className="mt-12 space-y-3">
                {[['1', 'Practise a focused question set', 'Answer choices are marked immediately.'], ['2', 'Understand the feedback', 'See the correct answer and explanation.'], ['3', 'Use your progress', 'Your dashboard updates from the same saved attempt.']].map(([number, title, copy]) => (
                  <div key={number} className="grid grid-cols-[42px_1fr] gap-4 rounded-2xl border border-white/10 bg-white/[.055] p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#f4d8cc] font-display text-xl text-[#a83f2b]">{number}</span><div><strong className="text-sm">{title}</strong><p className="mt-1 text-xs leading-5 text-white/48">{copy}</p></div></div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center">{[['8', 'SAT domains'], ['2', 'practice modes'], ['1', 'synced history']].map(([value, label]) => <div key={label}><strong className="block text-2xl">{value}</strong><span className="text-[9px] uppercase tracking-wider text-white/40">{label}</span></div>)}</div>
            </Card>
          </motion.div>
        </section>

        <section id="experience" className="bg-[#e9e3d5] px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
            <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#c34f38]">Experience it first</p><h2 className="mt-4 font-display text-5xl font-medium leading-none tracking-[-.04em] sm:text-6xl">Try the feedback loop.</h2><p className="mt-6 max-w-md leading-7 text-stone-600">Choose an answer and submit it. This miniature demo uses no account or saved data, but shows the same clear marking pattern used in the full practice experience.</p><div className="mt-8 space-y-3 text-sm text-stone-600"><p className="flex gap-3"><CheckCircle2 size={19} className="shrink-0 text-teal-700" /> Immediate correct or incorrect state</p><p className="flex gap-3"><CheckCircle2 size={19} className="shrink-0 text-teal-700" /> Correct answer and concise reasoning</p></div></div>

            <Card className="p-6 sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-teal-800/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-800">Advanced Math · Sample</span><span className="text-xs font-bold text-stone-400">Question 1 of 1</span></div>
              <h3 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight">The equation x² − 5x + 6 = 0 has which solutions?</h3>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {demoOptions.map(option => {
                  const isCorrect = submitted && option.key === correct;
                  const isWrong = submitted && selected === option.key && option.key !== correct;
                  return <button type="button" aria-pressed={selected === option.key} key={option.key} onClick={() => choose(option.key)} className={cn('flex min-h-20 items-center gap-4 rounded-2xl border p-4 text-left transition-all', selected === option.key ? 'border-teal-700 bg-teal-50' : 'border-stone-200 bg-white hover:-translate-y-0.5 hover:border-teal-700/35', isCorrect && 'border-emerald-600 bg-emerald-50', isWrong && 'border-red-500 bg-red-50')}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-xs font-extrabold">{option.key}</span><span className="text-sm font-bold">{option.value}</span></button>;
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-stone-500">{selected ? 'Ready to check your answer.' : 'Select one answer to continue.'}</p><Button disabled={!selected} onClick={() => setSubmitted(true)}>Check answer</Button></div>
              <AnimatePresence>
                {submitted && <motion.div aria-live="polite" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={cn('mt-6 overflow-hidden rounded-2xl border p-5', selected === correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}><strong className={selected === correct ? 'text-emerald-800' : 'text-red-700'}>{selected === correct ? 'Correct.' : 'Not quite.'}</strong><p className="mt-2 text-sm leading-6 text-stone-600">The expression factors to (x − 2)(x − 3) = 0, so the solutions are x = 2 and x = 3. The correct answer is B.</p></motion.div>}
              </AnimatePresence>
            </Card>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
          <div className="max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#c34f38]">Everything in one place</p><h2 className="mt-4 font-display text-5xl font-medium leading-none tracking-[-.045em] sm:text-7xl">Tools that work <em className="font-light text-teal-800">together.</em></h2><p className="mt-6 text-lg leading-8 text-stone-600">Each feature is useful alone. The real advantage is that they share one account, one answer history and one picture of your progress.</p></div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map(({ icon: Icon, number, title, copy, detail }, index) => <motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: index * .05 }}><Card className="group h-full p-6 hover:-translate-y-1"><div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-[#173c39] text-[#f4d8cc]"><Icon size={21} /></span><span className="font-display text-2xl text-stone-300">{number}</span></div><h3 className="mt-8 font-display text-2xl font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-6 text-stone-600">{copy}</p><p className="mt-5 border-t border-stone-900/10 pt-5 text-xs leading-5 text-stone-500">{detail}</p></Card></motion.article>)}
          </div>
        </section>

        <section id="workflow" className="bg-[#173c39] px-5 py-24 text-white sm:px-8 lg:py-32">
          <div className="mx-auto max-w-[1280px]"><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#f1b49f]">How it works</p><h2 className="mt-4 font-display text-5xl font-medium leading-none tracking-[-.04em]">From first answer to next focus.</h2></div><div className="grid gap-4 sm:grid-cols-3">{[['01', 'Create your workspace', 'Verify one account so attempts and saved items remain private and connected.'], ['02', 'Practise your way', 'Choose full sets or single questions, with optional domain targeting.'], ['03', 'Return with context', 'Use your dashboard and saved library to decide what deserves attention next.']].map(([number, title, copy]) => <div key={number} className="rounded-[1.6rem] border border-white/10 bg-white/[.055] p-6"><span className="font-display text-3xl text-[#f1b49f]">{number}</span><h3 className="mt-10 font-display text-2xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/50">{copy}</p></div>)}</div></div></div>
        </section>

        <section className="px-5 py-24 sm:px-8 lg:py-32"><Card className="mx-auto max-w-[1280px] overflow-hidden bg-[#e96b4d] p-8 text-white sm:p-14"><div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-white/60">Ready when you are</p><h2 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-none tracking-[-.045em] sm:text-7xl">Turn the next question into useful progress.</h2><p className="mt-6 max-w-xl text-white/70">Create an account to save attempts, synchronize practice modes and build your personal SAT study library.</p></div><div className="flex flex-wrap gap-3"><Button size="lg" className="bg-[#173c39] hover:bg-[#24534f]" onClick={() => navigate('/auth?mode=register')}>Create my account <ArrowRight size={18} /></Button><Button size="lg" variant="secondary" onClick={() => navigate('/auth?mode=login')}>Log in</Button></div></div></Card></section>
      </main>

      <footer className="border-t border-stone-900/10 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 text-xs text-stone-500 sm:flex-row"><span className="font-bold text-stone-700">PeakSAT Study Studio</span><span>Practice · Understand · Improve</span></div></footer>
    </div>
  );
}
