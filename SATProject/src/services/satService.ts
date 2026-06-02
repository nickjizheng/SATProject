import type { SatQuestion, AnswerRequest, AnswerResponse, ApiResponse, NextQuestionRequest, NextQuestionResponse } from '../types/sat';

const API_BASE_URL = 'http://localhost:8080/api/sat';

export class SatService {
  /**
   * 获取随机题目
   */
  static async getRandomQuestions(count: number = 10): Promise<SatQuestion[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/random?count=${count}`);
      const result: ApiResponse<SatQuestion[]> = await response.json();
      
      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || '获取随机题目失败');
      }
    } catch (error) {
      console.error('获取随机题目失败:', error);
      throw error;
    }
  }

  /**
   * Get questions by domain
   */
  static async getQuestionsByDomain(domain: string, count: number = 10): Promise<SatQuestion[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/domain/${encodeURIComponent(domain)}?count=${count}`);
      const result: ApiResponse<SatQuestion[]> = await response.json();
      
      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to get questions by domain');
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
        throw new Error(result.message || 'Failed to get domains');
      }
    } catch (error) {
      console.error('Failed to get domains:', error);
      throw error;
    }
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
        throw new Error(result.message || 'Failed to get question by ID');
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
        throw new Error(result.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
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
        },
        body: JSON.stringify(request),
      });
      
      const result: ApiResponse<NextQuestionResponse> = await response.json();
      
      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to get next question');
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
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token && user) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-User-Id'] = user.id.toString();
      }
      
      const response = await fetch(`${API_BASE_URL}/submit-answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });
      
      const result: ApiResponse<AnswerResponse> = await response.json();
      
      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to submit answer and record');
      }
    } catch (error) {
      console.error('Failed to submit answer and record:', error);
      throw error;
    }
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
        throw new Error(result.message || '创建会话失败');
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      throw error;
    }
  }
}
