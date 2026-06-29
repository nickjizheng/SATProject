import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/15 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-teal-800 text-white shadow-[0_10px_24px_rgba(17,94,89,0.22)] hover:-translate-y-0.5 hover:bg-teal-700',
        secondary: 'border border-stone-200 bg-white/80 text-stone-800 shadow-sm hover:-translate-y-0.5 hover:border-teal-700/30 hover:bg-white',
        ghost: 'text-stone-700 hover:bg-stone-900/5 hover:text-stone-950',
      },
      size: {
        default: 'h-11 px-5',
        lg: 'h-13 px-7 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
