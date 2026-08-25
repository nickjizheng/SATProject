import { API_BASE_URL as API_ROOT } from './apiConfig';
import type {
  MistakeFilters,
  MistakeReason,
  MistakeRecord,
  MistakeReflectionUpdate,
  MistakeSummary,
  QuestionReportRequest,
} from '../types/learning';

const LEARNING_API_BASE_URL = `${API_ROOT}/learning`;

interface ApiEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

interface MistakeRecordWire extends Omit<MistakeRecord, 'choices'> {
  choices?: MistakeRecord['choices'];
  choiceA?: string;
  choiceB?: string;
  choiceC?: string;
  choiceD?: string;
}

interface MistakeSummaryWire {
  unresolvedTotal?: number;
  byReason?: Array<{ reason?: string; label?: string; count?: number }>;
  byDomain?: Array<{ domain?: string; label?: string; count?: number }>;
}

const knownMistakeReasons: MistakeReason[] = [
  'UNCLASSIFIED',
  'CONCEPT_GAP',
  'MISREAD',
  'CALCULATION',
  'PACING',
  'GUESS',
];

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  let userId: string | undefined;

  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser) as { id?: string | number };
      if (parsedUser.id !== undefined && parsedUser.id !== null) userId = String(parsedUser.id);
    } catch {
      // The signed bearer token remains authoritative when the cached profile is malformed.
    }
  }

  if (!token) throw new Error('Sign in to use your personal learning history.');

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (userId) headers['X-User-Id'] = userId;
  return headers;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${LEARNING_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });

  let payload: ApiEnvelope<T> | T | null = null;
  try {
    payload = await response.json() as ApiEnvelope<T> | T;
  } catch {
    // The HTTP error below is still useful if the server returns an empty body.
  }

  const envelope = payload && typeof payload === 'object'
    && ('data' in payload || 'code' in payload || 'message' in payload)
    ? payload as ApiEnvelope<T>
    : null;

  if (!response.ok || (envelope?.code !== undefined && envelope.code !== 200)) {
    throw new Error(envelope?.message || `Learning-history request failed (${response.status}).`);
  }

  if (envelope) {
    if (envelope.data === undefined) {
      throw new Error(envelope.message || 'The learning-history service returned no data.');
    }
    return envelope.data;
  }

  if (payload === null) throw new Error('The learning-history service returned an empty response.');
  return payload as T;
};

const normalizeMistake = (record: MistakeRecordWire): MistakeRecord => ({
  ...record,
  choices: record.choices || {
    A: record.choiceA,
    B: record.choiceB,
    C: record.choiceC,
    D: record.choiceD,
  },
});

export class LearningService {
  static async getMistakes(filters: MistakeFilters = {}): Promise<MistakeRecord[]> {
    const query = new URLSearchParams();
    if (filters.reason) query.set('reason', filters.reason);
    if (filters.domain) query.set('domain', filters.domain);
    if (filters.resolved !== undefined) query.set('resolved', String(filters.resolved));
    if (filters.limit !== undefined) {
      query.set('limit', String(Math.min(100, Math.max(1, Math.round(filters.limit)))));
    }

    const suffix = query.size ? `?${query.toString()}` : '';
    const records = await request<MistakeRecordWire[]>(`/mistakes${suffix}`);
    return records.map(normalizeMistake);
  }

  static async getMistakeSummary(): Promise<MistakeSummary> {
    const summary = await request<MistakeSummaryWire>('/mistakes/summary');
    return {
      unresolvedTotal: Number(summary.unresolvedTotal || 0),
      byReason: (summary.byReason || []).map(item => {
        const value = item.reason || item.label || 'UNCLASSIFIED';
        return {
          reason: knownMistakeReasons.includes(value as MistakeReason) ? value as MistakeReason : 'UNCLASSIFIED',
          count: Number(item.count || 0),
        };
      }),
      byDomain: (summary.byDomain || []).flatMap(item => {
        const domain = item.domain || item.label;
        return domain ? [{ domain, count: Number(item.count || 0) }] : [];
      }),
    };
  }

  static async updateMistake(questionId: number, update: MistakeReflectionUpdate): Promise<MistakeRecord> {
    const record = await request<MistakeRecordWire>(`/mistakes/${questionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    return normalizeMistake(record);
  }

  static reportQuestion(questionId: number, report: QuestionReportRequest): Promise<unknown> {
    return request<unknown>(`/questions/${questionId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  }
}
