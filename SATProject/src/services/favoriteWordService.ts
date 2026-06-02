import type { ApiResponse } from '../types/sat';

const API_BASE_URL = 'http://localhost:8080/api/favorites';

export interface FavoriteWordRequest {
  word: string;
  wordData: string;
}

export interface FavoriteWordResponse {
  id: number;
  word: string;
  wordData: string;
  shortDefinition: string;
  partOfSpeech: string;
  pronunciation: string;
  createdAt: string;
}

export class FavoriteWordService {
  /**
   * 添加收藏单词
   */
  static async addFavoriteWord(request: FavoriteWordRequest): Promise<FavoriteWordResponse> {
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
      
      const result: ApiResponse<FavoriteWordResponse> = await response.json();
      
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
   * 获取收藏的单词列表
   */
  static async getFavoriteWords(): Promise<FavoriteWordResponse[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': localStorage.getItem('userId') || '1',
        },
      });
      
      const result: ApiResponse<FavoriteWordResponse[]> = await response.json();
      
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
   * 删除收藏的单词
   */
  static async removeFavoriteWord(word: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/remove/${encodeURIComponent(word)}`, {
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
   * 检查单词是否已收藏
   */
  static async checkFavoriteStatus(word: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/check/${encodeURIComponent(word)}`, {
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
