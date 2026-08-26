import { Link } from 'react-router-dom';
import { Info, LogIn } from 'lucide-react';
import { useGuestAccess } from '../../hooks/useGuestAccess';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useSignInDestination } from './signInPromptSupport';

export interface GuestTrialBannerProps {
  returnTo?: string;
  className?: string;
  alwaysShow?: boolean;
}

export function GuestTrialBanner({ returnTo, className, alwaysShow = false }: GuestTrialBannerProps) {
  const snapshot = useGuestAccess();
  const promptReason = snapshot.status === 'completed'
    ? 'trial-completed'
    : snapshot.status === 'unavailable'
      ? 'storage-unavailable'
      : 'save';
  const destination = useSignInDestination(returnTo, promptReason);

  if (!alwaysShow && (snapshot.signedIn || snapshot.status !== 'active')) return null;

  const message = snapshot.status === 'completed'
    ? <><strong>Guest trial used on this device.</strong> Any already-open in-memory set can continue, but starting or reloading another set requires sign-in.</>
    : snapshot.status === 'unavailable'
      ? <><strong>Guest trial unavailable.</strong> This browser cannot keep the entitlement metadata needed to enforce a one-time set, so sign-in is required.</>
      : snapshot.status === 'active'
        ? <><strong>Guest trial in progress.</strong> Only trial entitlement metadata is kept on this device; answers and question content are not saved locally.</>
        : <><strong>One-time guest trial available.</strong> Only entitlement metadata will be kept on this device; answers and question content will not be saved locally.</>;

  return (
    <aside
      aria-label="Guest trial information"
      className={cn('flex flex-col gap-3 rounded-2xl border border-amber-700/15 bg-amber-50/90 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Info aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700" size={17} />
        <p className="text-xs leading-5">{message} Sign in to save progress or use personalized features.</p>
      </div>
      <Button asChild size="sm" variant="secondary" className="shrink-0 border-amber-800/15 bg-white/75">
        <Link to={destination.loginPath} state={destination.state}>Sign in <LogIn size={14} /></Link>
      </Button>
    </aside>
  );
}
