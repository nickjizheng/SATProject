import { API_BASE_URL as API_ROOT } from './apiConfig';
import type {
  DomainReadiness,
  EvidenceLevel,
  LearningProfile,
  ReadinessSnapshot,
  Weekday,
} from '../types/learningCoach';

const LEARNING_API_BASE_URL = `${API_ROOT}/learning`;

interface ApiEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

const WEEKDAYS: Weekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const normalizeEvidence = (value: unknown): EvidenceLevel => {
  const normalized = String(value || '').toUpperCase();
  return normalized === 'HIGH' || normalized === 'MEDIUM' ? normalized : 'LOW';
};

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!token) throw new Error('Sign in to use your adaptive study plan.');

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser) as { id?: string | number };
      if (user.id !== undefined && user.id !== null) headers['X-User-Id'] = String(user.id);
    } catch {
      // The signed token is authoritative; stored profile data is only a compatibility hint.
    }
  }
  return headers;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${LEARNING_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...init?.headers,
    },
  });

  let payload: ApiEnvelope<T> | T | null = null;
  try {
    payload = await response.json() as ApiEnvelope<T> | T;
  } catch {
    // HTTP status handling below supplies a stable error for empty responses.
  }

  const envelope = payload && typeof payload === 'object'
    && ('data' in payload || 'code' in payload || 'message' in payload)
    ? payload as ApiEnvelope<T>
    : null;

  if (!response.ok || (envelope?.code !== undefined && envelope.code !== 200)) {
    throw new Error(envelope?.message || `Learning Coach request failed (${response.status}).`);
  }

  if (envelope) {
    if (envelope.data === undefined) throw new Error(envelope.message || 'Learning Coach returned no data.');
    return envelope.data;
  }
  if (payload === null) throw new Error('Learning Coach returned an empty response.');
  return payload as T;
};

const toNullableScore = (value: unknown) => {
  const score = Number(value);
  return Number.isFinite(score) && score >= 400 && score <= 1600 ? Math.round(score) : null;
};

const normalizeProfile = (profile: Partial<LearningProfile> | null | undefined): LearningProfile => ({
  testDate: typeof profile?.testDate === 'string' && profile.testDate ? profile.testDate : null,
  targetScore: toNullableScore(profile?.targetScore),
  baselineScore: toNullableScore(profile?.baselineScore),
  availableDays: Array.isArray(profile?.availableDays)
    ? profile.availableDays.filter((day): day is Weekday => WEEKDAYS.includes(day as Weekday))
    : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  dailyMinutes: Math.min(180, Math.max(5, Math.round(Number(profile?.dailyMinutes) || 25))),
});

const normalizeDomain = (domain: Partial<DomainReadiness>): DomainReadiness => ({
  domain: String(domain.domain || 'Unclassified domain'),
  attempts: Math.max(0, Number(domain.attempts) || 0),
  correctAttempts: Math.max(0, Number(domain.correctAttempts) || 0),
  accuracyPercent: Math.max(0, Math.min(100, Number(domain.accuracyPercent) || 0)),
  averageResponseTimeMs: domain.averageResponseTimeMs == null
    ? null
    : Math.max(0, Number(domain.averageResponseTimeMs) || 0),
  evidenceLevel: normalizeEvidence(domain.evidenceLevel),
  trendPercent: domain.trendPercent == null ? null : Number(domain.trendPercent) || 0,
});

export class LearningCoachService {
  static async getProfile(): Promise<LearningProfile> {
    return normalizeProfile(await request<Partial<LearningProfile>>('/profile'));
  }

  static async saveProfile(profile: LearningProfile): Promise<LearningProfile> {
    return normalizeProfile(await request<Partial<LearningProfile>>('/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizeProfile(profile)),
    }));
  }

  static async getReadiness(): Promise<ReadinessSnapshot> {
    const raw = await request<Partial<ReadinessSnapshot> & {
      domainReadiness?: DomainReadiness[];
      readiness?: DomainReadiness[];
    }>('/readiness');
    const domains = raw.domains || raw.domainReadiness || raw.readiness || [];
    return {
      overallEvidenceLevel: normalizeEvidence(raw.overallEvidenceLevel),
      domains: Array.isArray(domains) ? domains.map(normalizeDomain) : [],
    };
  }
}
