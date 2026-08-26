const GUEST_TRIAL_STORAGE_KEY = 'sat-buddy.guest-trial.v2';
const AUTH_TOKEN_STORAGE_KEY = 'token';
const GUEST_TRIAL_LEASE_MS = 5 * 60 * 1000;
const GUEST_TRIAL_LOCK_NAME = 'sat-buddy:guest-trial-reservation';
const SAFE_RETURN_PATHS = new Set([
  '/',
  '/home',
  '/dashboard',
  '/sat-practice',
  '/sat-single',
  '/review',
  '/exam-coach',
  '/pacing-lab',
  '/mistakes',
  '/resources',
  '/dictionary',
  '/favorite-words',
  '/favorite-questions',
]);

export const GUEST_ACCESS_CHANGE_EVENT = 'sat-buddy:guest-access-change';

export type GuestAccessIntent = 'practice-trial' | 'save' | 'personalized';
export type GuestAccessMode = 'account' | 'guest-trial';
export type GuestAccessBlockReason = 'account-required' | 'trial-completed' | 'storage-unavailable';
export type GuestTrialStatus = 'available' | 'active' | 'completed' | 'unavailable';
export type GuestTrialKey = 'practice' | 'quick' | 'pacing';
export type AuthMode = 'login' | 'register';

export interface GuestTrialSnapshot {
  signedIn: boolean;
  status: GuestTrialStatus;
  canBeginTrial: boolean;
  accountFeaturesAvailable: boolean;
  storageAvailable: boolean;
  activeTrialKey?: GuestTrialKey;
  startedAt?: string;
  completedAt?: string;
}

export type GuestAccessDecision =
  | { allowed: true; mode: GuestAccessMode; snapshot: GuestTrialSnapshot }
  | { allowed: false; reason: GuestAccessBlockReason; snapshot: GuestTrialSnapshot };

export interface AuthNavigationState {
  returnTo: string;
  gateReason?: GuestAccessBlockReason | 'save' | 'personalized';
}

interface ActiveGuestTrial {
  version: 2;
  status: 'active';
  trialKey: GuestTrialKey;
  ownerId: string;
  startedAt: string;
  leaseExpiresAt: string;
}

interface CompletedGuestTrial {
  version: 2;
  status: 'completed';
  trialKey: GuestTrialKey;
  startedAt: string;
  completedAt: string;
}

type StoredGuestTrial = ActiveGuestTrial | CompletedGuestTrial;

interface StoredTrialRead {
  storageAvailable: boolean;
  record: StoredGuestTrial | null;
  malformed: boolean;
}

const isoNow = () => new Date().toISOString();

export const createGuestTrialOwnerId = () => (
  globalThis.crypto?.randomUUID?.()
  || `guest-owner-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const hasWindow = () => typeof window !== 'undefined';

const isStoredGuestTrial = (value: unknown): value is StoredGuestTrial => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const common = record.version === 2
    && (record.trialKey === 'practice' || record.trialKey === 'quick' || record.trialKey === 'pacing')
    && typeof record.startedAt === 'string';
  if (!common) return false;
  if (record.status === 'active') {
    return typeof record.ownerId === 'string'
      && record.ownerId.length > 0
      && typeof record.leaseExpiresAt === 'string';
  }
  return record.status === 'completed' && typeof record.completedAt === 'string';
};

const activeLeaseExpired = (record: StoredGuestTrial | null) => (
  record?.status === 'active'
  && new Date(record.leaseExpiresAt).getTime() <= Date.now()
);

const readStoredTrial = (): StoredTrialRead => {
  if (!hasWindow()) return { storageAvailable: false, record: null, malformed: false };

  try {
    const raw = window.localStorage.getItem(GUEST_TRIAL_STORAGE_KEY);
    if (!raw) return { storageAvailable: true, record: null, malformed: false };
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredGuestTrial(parsed)) {
      // Fail closed when entitlement metadata is damaged so a corrupt record cannot create repeat trials.
      return { storageAvailable: true, record: null, malformed: true };
    }
    return { storageAvailable: true, record: parsed, malformed: false };
  } catch {
    return { storageAvailable: false, record: null, malformed: false };
  }
};

const writeStoredTrial = (record: StoredGuestTrial) => {
  if (!hasWindow()) return false;
  try {
    window.localStorage.setItem(GUEST_TRIAL_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
};

const removeStoredTrial = () => {
  if (!hasWindow()) return false;
  try {
    window.localStorage.removeItem(GUEST_TRIAL_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

export const notifyGuestAccessChanged = () => {
  if (hasWindow()) window.dispatchEvent(new Event(GUEST_ACCESS_CHANGE_EVENT));
};

export const getUsableAuthToken = () => {
  if (!hasWindow()) return null;
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(window.atob(padded)) as { exp?: unknown; userId?: unknown; sub?: unknown };
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null;
    if ((typeof payload.userId !== 'number' && typeof payload.userId !== 'string') || typeof payload.sub !== 'string') return null;
    const storedUser = JSON.parse(window.localStorage.getItem('user') || 'null') as { id?: unknown } | null;
    if (!storedUser || String(storedUser.id) !== String(payload.userId)) return null;
    return token;
  } catch {
    return null;
  }
};

export const isSignedIn = () => Boolean(getUsableAuthToken());

export const sanitizeReturnPath = (candidate: unknown, fallback = '/home'): string => {
  const parse = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    const hasUnsafeCharacter = Array.from(trimmed).some(character => {
      const code = character.charCodeAt(0);
      return character === '\\' || code <= 31 || code === 127;
    });
    if (!trimmed.startsWith('/') || trimmed.startsWith('//') || hasUnsafeCharacter) return null;

    try {
      const baseOrigin = hasWindow() ? window.location.origin : 'https://sat-buddy.local';
      const parsed = new URL(trimmed, baseOrigin);
      if (parsed.origin !== baseOrigin || !SAFE_RETURN_PATHS.has(parsed.pathname)) return null;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return null;
    }
  };

  return parse(candidate) || parse(fallback) || '/home';
};

export const currentReturnPath = (fallback = '/home') => {
  if (!hasWindow()) return sanitizeReturnPath(fallback);
  return sanitizeReturnPath(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
    fallback,
  );
};

export const buildAuthPath = (returnTo?: string, mode: AuthMode = 'login') => {
  const params = new URLSearchParams({
    mode,
    returnTo: sanitizeReturnPath(returnTo || currentReturnPath()),
  });
  return `/auth?${params.toString()}`;
};

const getSnapshot = (): GuestTrialSnapshot => {
  const signedIn = isSignedIn();
  const stored = readStoredTrial();
  const record = activeLeaseExpired(stored.record) ? null : stored.record;
  const status: GuestTrialStatus = !stored.storageAvailable
    ? 'unavailable'
    : stored.malformed
      ? 'completed'
      : record?.status || 'available';

  return {
    signedIn,
    status,
    canBeginTrial: signedIn || (stored.storageAvailable && status === 'available'),
    accountFeaturesAvailable: signedIn,
    storageAvailable: stored.storageAvailable,
    activeTrialKey: record?.trialKey,
    startedAt: record?.startedAt,
    completedAt: record?.status === 'completed' ? record.completedAt : undefined,
  };
};

const beginTrial = (trialKey: GuestTrialKey, ownerId: string): GuestAccessDecision => {
  const snapshot = getSnapshot();
  if (snapshot.signedIn) return { allowed: true, mode: 'account', snapshot };
  if (!snapshot.storageAvailable) return { allowed: false, reason: 'storage-unavailable', snapshot };
  if (snapshot.status === 'completed') return { allowed: false, reason: 'trial-completed', snapshot };
  if (snapshot.status === 'active') {
    const active = readStoredTrial().record;
    return active?.status === 'active'
      && active.trialKey === trialKey
      && active.ownerId === ownerId
      ? { allowed: true, mode: 'guest-trial', snapshot }
      : { allowed: false, reason: 'account-required', snapshot };
  }

  const startedAt = isoNow();
  const stored = Boolean(ownerId) && writeStoredTrial({
    version: 2,
    status: 'active',
    trialKey,
    ownerId,
    startedAt,
    leaseExpiresAt: new Date(Date.now() + GUEST_TRIAL_LEASE_MS).toISOString(),
  });
  if (!stored) {
    const unavailable = { ...getSnapshot(), storageAvailable: false, status: 'unavailable' as const, canBeginTrial: false };
    return { allowed: false, reason: 'storage-unavailable', snapshot: unavailable };
  }

  notifyGuestAccessChanged();
  return { allowed: true, mode: 'guest-trial', snapshot: getSnapshot() };
};

const completeTrial = (trialKey: GuestTrialKey, ownerId: string): GuestTrialSnapshot => {
  const snapshot = getSnapshot();
  const active = readStoredTrial().record;
  if (snapshot.signedIn
      || active?.status !== 'active'
      || active.trialKey !== trialKey
      || active.ownerId !== ownerId) return snapshot;

  if (writeStoredTrial({
    version: 2,
    status: 'completed',
    trialKey,
    startedAt: active.startedAt,
    completedAt: isoNow(),
  })) {
    notifyGuestAccessChanged();
  }
  return getSnapshot();
};

const releaseTrial = (trialKey: GuestTrialKey, ownerId: string): GuestTrialSnapshot => {
  const active = readStoredTrial().record;
  if (active?.status === 'active'
      && active.trialKey === trialKey
      && active.ownerId === ownerId
      && removeStoredTrial()) {
    notifyGuestAccessChanged();
  }
  return getSnapshot();
};

const reserveTrial = async (trialKey: GuestTrialKey, ownerId: string): Promise<GuestAccessDecision> => {
  const reserve = () => beginTrial(trialKey, ownerId);

  if (hasWindow() && globalThis.navigator?.locks) {
    return globalThis.navigator.locks.request(
      GUEST_TRIAL_LOCK_NAME,
      { mode: 'exclusive' },
      reserve,
    );
  }

  // Fallback for browsers without Web Locks: allow competing tabs to settle,
  // then only the owner whose reservation remains in localStorage proceeds.
  const decision = reserve();
  if (!decision.allowed || decision.mode === 'account') return decision;
  await new Promise(resolve => globalThis.setTimeout(resolve, 25));
  const active = readStoredTrial().record;
  if (active?.status === 'active'
      && active.trialKey === trialKey
      && active.ownerId === ownerId) return decision;
  return { allowed: false, reason: 'account-required', snapshot: getSnapshot() };
};

function requestAccess(intent: 'practice-trial', trialKey: GuestTrialKey, ownerId: string): GuestAccessDecision;
function requestAccess(intent: Exclude<GuestAccessIntent, 'practice-trial'>): GuestAccessDecision;
function requestAccess(intent: GuestAccessIntent, trialKey?: GuestTrialKey, ownerId?: string): GuestAccessDecision {
  const snapshot = getSnapshot();
  if (snapshot.signedIn) return { allowed: true, mode: 'account', snapshot };
  if (intent === 'practice-trial') {
    return trialKey && ownerId
      ? beginTrial(trialKey, ownerId)
      : { allowed: false, reason: 'account-required', snapshot };
  }
  return { allowed: false, reason: 'account-required', snapshot };
}

const subscribe = (listener: (snapshot: GuestTrialSnapshot) => void) => {
  if (!hasWindow()) return () => undefined;

  const emit = () => listener(getSnapshot());
  const handleStorage = (event: StorageEvent) => {
    if (event.key === GUEST_TRIAL_STORAGE_KEY || event.key === AUTH_TOKEN_STORAGE_KEY || event.key === null) emit();
  };

  window.addEventListener(GUEST_ACCESS_CHANGE_EVENT, emit);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(GUEST_ACCESS_CHANGE_EVENT, emit);
    window.removeEventListener('storage', handleStorage);
  };
};

export const guestTrialService = {
  getSnapshot,
  isSignedIn,
  requestAccess,
  reserveTrial,
  beginTrial,
  completeTrial,
  releaseTrial,
  subscribe,
};

export const GUEST_TRIAL_METADATA_KEY = GUEST_TRIAL_STORAGE_KEY;
