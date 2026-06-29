interface BrandProps {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}

export default function Brand({ compact = false, inverse = false, className = '' }: BrandProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img src="/sat-buddy-mark.svg" alt="" className="size-11 shrink-0" />
      {!compact && (
        <span className="text-left">
          <strong className={`block font-display text-[1.65rem] font-semibold leading-none tracking-tight ${inverse ? 'text-white' : 'text-[#2a2a2a]'}`}>
            SAT<span className="text-[#e07a5f]">-</span>Buddy
          </strong>
          <small className={`mt-1 block text-[9px] font-bold uppercase tracking-[.2em] ${inverse ? 'text-teal-50/55' : 'text-[#123d3a]/58'}`}>
            By students, for students
          </small>
        </span>
      )}
    </span>
  );
}
