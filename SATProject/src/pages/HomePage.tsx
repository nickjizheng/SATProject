import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpenText, ChartNoAxesCombined, Search, Sparkles, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const features = [
  { icon: BookOpenText, title: 'Curated practice', copy: 'Focused SAT sets that adapt around what you have already completed.', path: '/sat-practice', tone: 'bg-teal-800 text-white' },
  { icon: ChartNoAxesCombined, title: 'Visible progress', copy: 'See accuracy, activity and domain performance without digging through data.', path: '/dashboard', tone: 'bg-[#e96b4d] text-white' },
  { icon: Search, title: 'Vocabulary studio', copy: 'Look up, understand and save unfamiliar words while you study.', path: '/dictionary', tone: 'bg-[#edd6a8] text-stone-900' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page-shell overflow-hidden">
      <section className="relative grid min-h-[68vh] items-center gap-12 py-10 lg:grid-cols-[1.08fr_.92fr] lg:py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}>
          <div className="page-kicker flex items-center gap-2"><Sparkles size={14} /> Your SAT study studio</div>
          <h1 className="page-title mt-5 max-w-4xl">Study with <em className="font-light text-teal-800">direction</em>, not just repetition.</h1>
          <p className="page-subtitle mt-7 max-w-2xl">A calmer, clearer place to practise questions, understand your performance and turn new vocabulary into lasting knowledge.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/sat-practice')}>Start a practice set <ArrowUpRight size={18} /></Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')}>View my progress</Button>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-stone-900/10 pt-6 text-sm text-stone-600">
            <span><strong className="text-stone-900">One account</strong> across every mode</span>
            <span><strong className="text-stone-900">Live accuracy</strong> from saved attempts</span>
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
                {[['10', 'questions'], ['1', 'domain'], ['~12', 'minutes']].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/7 p-4">
                    <strong className="block text-xl">{value}</strong><span className="text-[10px] uppercase tracking-wider text-teal-50/45">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      <section className="grid gap-4 pb-8 md:grid-cols-3">
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
    </div>
  );
}
