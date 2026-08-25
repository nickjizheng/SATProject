export interface TrademarkNoticeProps {
  className?: string;
}

export default function TrademarkNotice({ className = '' }: TrademarkNoticeProps) {
  return (
    <aside
      aria-label="SAT trademark notice"
      className={`rounded-2xl border border-stone-900/10 bg-white/55 px-5 py-4 text-xs leading-5 text-stone-600 ${className}`.trim()}
      role="note"
    >
      SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.
    </aside>
  );
}
