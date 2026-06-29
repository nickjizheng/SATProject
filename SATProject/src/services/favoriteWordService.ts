import type { ApiResponse } from '../types/sat';
import { API_BASE_URL as API_ROOT } from './apiConfig';

const API_BASE_URL = `${API_ROOT}/favorites`;

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
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });

      const result: ApiResponse<FavoriteWordResponse> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to add the word to favorites.');
      }
    } catch (error) {
      console.error('Failed to add favorite word:', error);
      throw error;
    }
  }

  /**
   * 获取收藏的单词列表
   */
  static async getFavoriteWords(): Promise<FavoriteWordResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/list`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result: ApiResponse<FavoriteWordResponse[]> = await response.json();

      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch favorite words.');
      }
    } catch (error) {
      console.error('Failed to fetch favorite words:', error);
      throw error;
    }
  }

  /**
   * 删除收藏的单词
   */
  static async removeFavoriteWord(word: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/remove/${encodeURIComponent(word)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result: ApiResponse<void> = await response.json();

      if (result.code !== 200) {
        throw new Error(result.message || 'Failed to remove the word from favorites.');
      }
    } catch (error) {
      console.error('Failed to remove favorite word:', error);
      throw error;
    }
  }

  /**
   * 检查单词是否已收藏
   */
  static async checkFavoriteStatus(word: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/check/${encodeURIComponent(word)}`, {
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
      console.error('Failed to check favorite word status:', error);
      return false;
    }
  }
}
