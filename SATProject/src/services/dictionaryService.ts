import type { DictionaryResponse } from '../types/dictionary';
import type { ApiResponse } from '../types/sat';
import { API_BASE_URL } from './apiConfig';

export class DictionaryService {
  /**
   * 获取单词释义
   */
  static async getWordDefinition(word: string): Promise<DictionaryResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dictionary/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<DictionaryResponse[]> = await response.json();
      if (result.code !== 200 || !result.data) {
        throw new Error(result.message || 'Dictionary lookup failed.');
      }
      return result.data;
    } catch (error) {
      console.error('获取单词释义失败:', error);
      throw error;
    }
  }
}
