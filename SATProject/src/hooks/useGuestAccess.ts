import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  buildAuthPath,
  guestTrialService,
  sanitizeReturnPath,
  type AuthMode,
  type AuthNavigationState,
  type GuestAccessIntent,
  type GuestTrialSnapshot,
} from '../services/guestTrialService';

export function useGuestAccess(): GuestTrialSnapshot {
  const [snapshot, setSnapshot] = useState(() => guestTrialService.getSnapshot());

  useEffect(() => guestTrialService.subscribe(setSnapshot), []);
  return snapshot;
}

interface AccountGateOptions {
  returnTo?: string;
  mode?: AuthMode;
}

export function useAccountGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const snapshot = useGuestAccess();

  const requireAccount = (intent: Exclude<GuestAccessIntent, 'practice-trial'>, options: AccountGateOptions = {}) => {
    const decision = guestTrialService.requestAccess(intent);
    if (decision.allowed) return true;

    const returnTo = sanitizeReturnPath(
      options.returnTo || `${location.pathname}${location.search}${location.hash}`,
    );
    const state: AuthNavigationState = {
      returnTo,
      gateReason: intent,
    };
    navigate(buildAuthPath(returnTo, options.mode || 'login'), { state });
    return false;
  };

  return { signedIn: snapshot.signedIn, snapshot, requireAccount };
}
