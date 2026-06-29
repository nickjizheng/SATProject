import * as React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[1.75rem] border border-stone-200/80 bg-white/80 shadow-[0_18px_60px_rgba(32,42,39,0.08)] backdrop-blur-xl', className)}
      {...props}
    />
  );
}
