import { Link } from 'react-router-dom';
import { ArrowRight, Cloud, LockKeyhole, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { getSignInPromptCopy, useSignInDestination, type SignInPromptReason } from './signInPromptSupport';

export interface SignInPromptProps {
  reason?: SignInPromptReason;
  returnTo?: string;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function SignInPrompt({
  reason = 'account-required',
  returnTo,
  title,
  description,
  className,
  compact = false,
}: SignInPromptProps) {
  const copy = getSignInPromptCopy(reason);
  const destination = useSignInDestination(returnTo, reason);

  return (
    <Card className={cn('overflow-hidden', className)} role="region" aria-label="Sign in required">
      <div className={cn('grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6', !compact && 'sm:p-8')}>
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-teal-800/10 text-teal-800">
          {reason === 'personalized' ? <Sparkles size={21} /> : reason === 'save' ? <Cloud size={21} /> : <LockKeyhole size={21} />}
        </span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#bd4e39]">{copy.eyebrow}</p>
          <h2 className={cn('mt-1 font-display font-semibold text-stone-900', compact ? 'text-2xl' : 'text-3xl')}>{title || copy.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{description || copy.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button asChild variant="secondary">
            <Link to={destination.registerPath} state={destination.state}>Create account</Link>
          </Button>
          <Button asChild>
            <Link to={destination.loginPath} state={destination.state}>Sign in <ArrowRight size={16} /></Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
