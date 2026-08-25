import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { LearningService } from '../services/learningService';
import type { QuestionReportReason } from '../types/learning';
import { questionReportOptions } from '../utils/learningLabels';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface QuestionReportPanelProps {
  questionId: number;
  className?: string;
}

export default function QuestionReportPanel({ questionId, className }: QuestionReportPanelProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<QuestionReportReason | ''>('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle');
  const inFlight = useRef(false);

  const submit = async () => {
    if (!reason || inFlight.current || state === 'sent') return;
    inFlight.current = true;
    setSubmitting(true);
    setState('idle');
    try {
      await LearningService.reportQuestion(questionId, {
        reason,
        detail: detail.trim() || undefined,
      });
      setState('sent');
    } catch {
      setState('error');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section aria-label="Question quality feedback" className={cn('rounded-2xl border border-stone-900/10 bg-white/55 p-4 sm:p-5', className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/15"
      >
        <span className="flex items-center gap-2 text-xs font-extrabold text-stone-600"><Flag size={15} /> Something looks wrong with this item?</span>
        <span className="flex items-center gap-1 text-xs font-bold text-teal-800">Report it {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>

      {open && (
        <div className="mt-4 border-t border-stone-900/10 pt-4">
          {state === 'sent' ? (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-800"><CheckCircle2 className="mt-0.5 shrink-0" size={15} /> Report received. This flags the item for review; it does not assume the provided key is correct.</p>
          ) : (
            <>
              <fieldset>
                <legend className="text-xs font-bold text-stone-700">What should be reviewed?</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {questionReportOptions.map(option => (
                    <label key={option.value} className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs leading-5 transition-colors',
                      reason === option.value ? 'border-teal-800 bg-teal-50' : 'border-stone-900/10 bg-white/70 hover:border-teal-800/30',
                    )}>
                      <input
                        type="radio"
                        name={`question-report-${questionId}`}
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => { setReason(option.value); setState('idle'); }}
                        className="mt-1 accent-teal-800"
                      />
                      <span><strong className="block text-stone-800">{option.label}</strong><span className="text-stone-500">{option.description}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mt-4 grid gap-2 text-xs font-bold text-stone-700">
                Helpful detail <span className="font-normal text-stone-400">(optional)</span>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={detail}
                  placeholder="Briefly explain what looks inconsistent or broken."
                  onChange={event => { setDetail(event.target.value); setState('idle'); }}
                  className="w-full resize-y rounded-xl border border-stone-900/10 bg-white px-3 py-2.5 text-sm font-normal leading-6 text-stone-700 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                />
              </label>

              {state === 'error' && <p role="alert" className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-red-700"><AlertCircle className="mt-0.5 shrink-0" size={14} /> The report could not be sent. Try again, or use a different practice item.</p>}
              <Button className="mt-4" size="sm" disabled={!reason || submitting} onClick={() => void submit()}>
                <Flag size={14} /> {submitting ? 'Sending…' : 'Send report'}
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
