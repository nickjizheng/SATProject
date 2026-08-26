import type { SatQuestion, AnswerRequest, AnswerResponse, ApiResponse, NextQuestionRequest, NextQuestionResponse, SatBankSummary } from '../types/sat';
import { API_BASE_URL as API_ROOT } from './apiConfig';
import { getUsableAuthToken } from './guestTrialService';

const API_BASE_URL = `${API_ROOT}/sat`;
const DASHBOARD_API_BASE_URL = `${API_ROOT}/dashboard`;

interface AnswerSummaryPayload {
  answeredQuestions?: number;
  correctAnswers?: number;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = getUsableAuthToken();
  const userStr = localStorage.getItem('user');
  let userId: string | undefined;
  const headers: Record<string, string> = {};

  if (userStr) {
    try {
      const user = JSON.parse(userStr) as { id?: string | number };
      if (user.id !== undefined && user.id !== null) userId = String(user.id);
    } catch {
      // The bearer token remains authoritative; malformed local profile data should not crash public practice reads.
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (token && userId) {
    headers['X-User-Id'] = userId;
  }

  return headers;
};

export class SatService {
  static async getAnswerSummary(): Promise<{ answeredQuestions: number; correctAnswers: number; accuracy: number }> {
    const headers = getAuthHeaders();

    if (!headers['X-User-Id']) {
      return {
        answeredQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
      };
    }

    const response = await fetch(`${DASHBOARD_API_BASE_URL}/stats`, {
      method: 'GET',
      headers,
    });

    const result: ApiResponse<AnswerSummaryPayload> = await response.json();

    if (!response.ok || result.code !== 200 || !result.data) {
      throw new Error(result.message || 'Failed to fetch SAT answer summary.');
    }

    const answeredQuestions = Number(result.data.answeredQuestions || 0);
    const correctAnswers = Number(result.data.correctAnswers || 0);

    return {
      answeredQuestions,
      correctAnswers,
      accuracy: answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0,
    };
  }

  /**
   * 获取随机题目
   */
  static async getRandomQuestions(count: number = 10): Promise<SatQuestion[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/random?count=${count}`, {
        headers: getAuthHeaders(),
      });
      const result: ApiResponse<SatQuestion[]> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error('Failed to fetch random questions.');
      }
    } catch (error) {
      console.error('Failed to fetch random questions:', error);
      throw error;
    }
  }

  /**
   * Get questions by domain
   */
  static async getQuestionsByDomain(domain: string, count: number = 10): Promise<SatQuestion[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/domain/${encodeURIComponent(domain)}?count=${count}`, {
        headers: getAuthHeaders(),
      });
      const result: ApiResponse<SatQuestion[]> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error('Failed to fetch questions for the selected domain.');
      }
    } catch (error) {
      console.error('Failed to get questions by domain:', error);
      throw error;
    }
  }

  /**
   * Get all domains
   */
  static async getAllDomains(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/domains`);
      const result: ApiResponse<string[]> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error('Failed to fetch domains.');
      }
    } catch (error) {
      console.error('Failed to get domains:', error);
      throw error;
    }
  }

  static async getBankSummary(): Promise<SatBankSummary> {
    const response = await fetch(`${API_BASE_URL}/bank-summary`);
    const result: ApiResponse<SatBankSummary> = await response.json();

    if (!response.ok || result.code !== 200 || !result.data) {
      throw new Error(result.message || 'Failed to fetch question-bank details.');
    }

    return result.data;
  }

  /**
   * 根据ID获取题目
   */
  static async getQuestionById(id: number): Promise<SatQuestion> {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${id}`);
      const result: ApiResponse<SatQuestion> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error('Failed to fetch the requested question.');
      }
    } catch (error) {
      console.error('Failed to get question by ID:', error);
      throw error;
    }
  }

  /**
   * Submit answer
   */
  static async submitAnswer(request: AnswerRequest): Promise<AnswerResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<AnswerResponse> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to submit your answer.');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }

  /**
   * Check an answer without creating attempt, review, readiness, or mistake records.
   * Guest practice must use this endpoint so anonymous work remains session-only.
   */
  static async checkAnswer(request: Pick<AnswerRequest, 'questionId' | 'answer'>): Promise<AnswerResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/check-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId: request.questionId, answer: request.answer }),
      });

      const result: ApiResponse<AnswerResponse> = await response.json();

      if (response.ok && result.code === 200 && result.data) {
        return result.data;
      }

      throw new Error(result.message || 'Failed to check your answer.');
    } catch (error) {
      console.error('Failed to check answer without recording it:', error);
      throw error;
    }
  }

  /**
   * 获取下一道未做过的题目
   */
  static async getNextQuestion(request: NextQuestionRequest): Promise<NextQuestionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });

      const result: ApiResponse<NextQuestionResponse> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error('Failed to fetch the next question.');
      }
    } catch (error) {
      console.error('Failed to get next question:', error);
      throw error;
    }
  }

  /**
   * Submit answer and record
   */
  static async submitAnswerWithRecord(request: AnswerRequest): Promise<AnswerResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      const response = await fetch(`${API_BASE_URL}/submit-answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const result: ApiResponse<AnswerResponse> = await response.json();

      if (response.ok && result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to submit and record your answer.');
      }
    } catch (error) {
      console.error('Failed to submit answer and record:', error);
      throw error;
    }
  }

  static async getRecordedAnswer(questionId: number, sessionId: string): Promise<AnswerResponse | null> {
    const response = await fetch(
      `${API_BASE_URL}/answer-record/${questionId}?sessionId=${encodeURIComponent(sessionId)}`,
      { headers: getAuthHeaders() },
    );
    const result: ApiResponse<AnswerResponse> = await response.json();

    if (result.code !== 200) {
      throw new Error('Failed to retrieve the saved attempt.');
    }

    return result.data ?? null;
  }

  /**
   * 生成新的会话ID
   */
  static async generateSession(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: ApiResponse<string> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error('Failed to create a new session.');
      }
    } catch (error) {
      console.error('Failed to create a new session:', error);
      throw error;
    }
  }
}
