import { API_BASE_URL as API_ROOT } from './apiConfig';
import type {
  ReviewAdjustment,
  ReviewForecastPoint,
  ReviewGrade,
  ReviewQueueItem,
  ReviewSummary,
} from '../types/review';

const REVIEW_API_BASE_URL = `${API_ROOT}/review`;

interface ApiEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  let userId: string | undefined;

  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser) as { id?: string | number };
      if (parsedUser.id !== undefined && parsedUser.id !== null) {
        userId = String(parsedUser.id);
      }
    } catch {
      // Identity comes from the signed bearer token; the stored profile is only a compatibility hint.
    }
  }

  if (!token) {
    throw new Error('Sign in to use your personalized review schedule.');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (userId) headers['X-User-Id'] = userId;
  return headers;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${REVIEW_API_BASE_URL}${path}`, {
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
    // The HTTP status below still gives the caller a useful error for an empty response.
  }

  const envelope = payload && typeof payload === 'object'
    && ('data' in payload || 'code' in payload || 'message' in payload)
    ? payload as ApiEnvelope<T>
    : null;
  const message = envelope?.message || `Review request failed (${response.status}).`;

  if (!response.ok || (envelope?.code !== undefined && envelope.code !== 200)) {
    throw new Error(message);
  }

  if (envelope) {
    if (envelope.data === undefined) {
      throw new Error(envelope.message || 'The review service returned no data.');
    }
    return envelope.data;
  }

  if (payload === null) {
    throw new Error('The review service returned an empty response.');
  }

  return payload as T;
};

export class ReviewService {
  static getSummary(): Promise<ReviewSummary> {
    return request<ReviewSummary>('/summary');
  }

  static getQueue(limit = 20): Promise<ReviewQueueItem[]> {
    const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));
    return request<ReviewQueueItem[]>(`/queue?limit=${safeLimit}`);
  }

  static getForecast(days = 7): Promise<ReviewForecastPoint[]> {
    const safeDays = Math.min(30, Math.max(1, Math.round(days)));
    return request<ReviewForecastPoint[]>(`/forecast?days=${safeDays}`);
  }

  static adjust(questionId: number, grade: ReviewGrade): Promise<ReviewAdjustment> {
    return request<ReviewAdjustment>('/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, grade: grade.toUpperCase() }),
    });
  }
}
