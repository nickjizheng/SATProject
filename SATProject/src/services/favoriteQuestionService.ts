import type { ApiResponse } from '../types/sat';

const API_BASE_URL = 'http://localhost:8080/api/favorite-questions';

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Id': localStorage.getItem('userId') || '1', // 临时使用，实际应该从token解析
        },
        body: JSON.stringify(request),
      });
      
      const result: ApiResponse<FavoriteQuestionResponse> = await response.json();
      
      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || '添加收藏失败');
      }
    } catch (error) {
      console.error('添加收藏失败:', error);
      throw error;
    }
  }

  /**
   * 获取收藏的题目列表
   */
  static async getFavoriteQuestions(): Promise<FavoriteQuestionResponse[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': localStorage.getItem('userId') || '1',
        },
      });
      
      const result: ApiResponse<FavoriteQuestionResponse[]> = await response.json();
      
      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || '获取收藏列表失败');
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除收藏的题目
   */
  static async removeFavoriteQuestion(questionId: number): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/remove/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': localStorage.getItem('userId') || '1',
        },
      });
      
      const result: ApiResponse<void> = await response.json();
      
      if (result.code !== 200) {
        throw new Error(result.message || '删除收藏失败');
      }
    } catch (error) {
      console.error('删除收藏失败:', error);
      throw error;
    }
  }

  /**
   * 检查题目是否已收藏
   */
  static async checkFavoriteStatus(questionId: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/check/${questionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': localStorage.getItem('userId') || '1',
        },
      });
      
      const result: ApiResponse<boolean> = await response.json();
      
      if (result.code === 200) {
        return result.data || false;
      } else {
        return false;
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  }
}
