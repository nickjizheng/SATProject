import { useLocation } from 'react-router-dom';
import {
  buildAuthPath,
  sanitizeReturnPath,
  type AuthNavigationState,
  type GuestAccessBlockReason,
} from '../../services/guestTrialService';

export type SignInPromptReason = GuestAccessBlockReason | 'save' | 'personalized';

export interface SignInPromptCopy {
  eyebrow: string;
  title: string;
  description: string;
}

const promptCopy: Record<SignInPromptReason, SignInPromptCopy> = {
  'trial-completed': {
    eyebrow: 'Guest trial complete',
    title: 'Keep going with an account.',
    description: 'Sign in or create an account to start another session and keep future progress connected.',
  },
  'account-required': {
    eyebrow: 'Account feature',
    title: 'Sign in to continue.',
    description: 'This action needs an account so your work can be saved and kept separate from the device-only trial.',
  },
  'storage-unavailable': {
    eyebrow: 'Private storage unavailable',
    title: 'Sign in to start safely.',
    description: 'This browser cannot retain the small entitlement record needed for a one-time guest trial. No answers or question content were stored.',
  },
  save: {
    eyebrow: 'Save your work',
    title: 'Sign in to save this.',
    description: 'Guest access does not save answers, notes, or question content locally. An account keeps your work available for later.',
  },
  personalized: {
    eyebrow: 'Personal study plan',
    title: 'Sign in for personalized guidance.',
    description: 'Recommendations, review schedules, and progress history need an account so they stay connected to you.',
  },
};

export const getSignInPromptCopy = (reason: SignInPromptReason) => promptCopy[reason];

export interface SignInDestination {
  loginPath: string;
  registerPath: string;
  state: AuthNavigationState;
}

export const useSignInDestination = (returnTo?: string, reason: SignInPromptReason = 'account-required'): SignInDestination => {
  const location = useLocation();
  const safeReturnTo = sanitizeReturnPath(
    returnTo || `${location.pathname}${location.search}${location.hash}`,
  );
  const state: AuthNavigationState = { returnTo: safeReturnTo, gateReason: reason };

  return {
    loginPath: buildAuthPath(safeReturnTo, 'login'),
    registerPath: buildAuthPath(safeReturnTo, 'register'),
    state,
  };
};
