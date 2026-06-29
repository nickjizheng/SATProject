import type { ApiResponse } from '../types/sat';

const API_BASE_URL = 'http://localhost:8080/api/favorite-questions';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (user?.id) {
    headers['X-User-Id'] = user.id.toString();
  }

  return headers;
};

export interface FavoriteQuestionRequest {
  questionId: number;
  questionData: string;
}

export interface FavoriteQuestionResponse {
  id: number;
  questionId: number;
  questionData: string;
  questionText: string;
  domain: string;
  difficulty: string;
  createdAt: string;
}

export class FavoriteQuestionService {
  /**
   * 添加收藏题目
   */
  static async addFavoriteQuestion(request: FavoriteQuestionRequest): Promise<FavoriteQuestionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });

      const result: ApiResponse<FavoriteQuestionResponse> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to add the question to favorites.');
      }
    } catch (error) {
      console.error('Failed to add favorite question:', error);
      throw error;
    }
  }

  /**
   * 获取收藏的题目列表
   */
  static async getFavoriteQuestions(): Promise<FavoriteQuestionResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/list`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result: ApiResponse<FavoriteQuestionResponse[]> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch favorite questions.');
      }
    } catch (error) {
      console.error('Failed to fetch favorite questions:', error);
      throw error;
    }
  }

  /**
   * 删除收藏的题目
   */
  static async removeFavoriteQuestion(questionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/remove/${questionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result: ApiResponse<void> = await response.json();

      if (result.code !== 200) {
        throw new Error(result.message || 'Failed to remove the question from favorites.');
      }
    } catch (error) {
      console.error('Failed to remove favorite question:', error);
      throw error;
    }
  }

  /**
   * 检查题目是否已收藏
   */
  static async checkFavoriteStatus(questionId: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/check/${questionId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result: ApiResponse<boolean> = await response.json();

      if (result.code === 200) {
        return result.data || false;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Failed to check favorite question status:', error);
      return false;
    }
  }
}
