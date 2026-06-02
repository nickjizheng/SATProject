import type { DictionaryResponse } from '../types/dictionary';

const DICTIONARY_API_BASE_URL = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json';
const API_KEY = 'c7c92f9d-8f7d-48ce-a739-b8c3c2de5539';

export class DictionaryService {
  /**
   * 获取单词释义
   */
  static async getWordDefinition(word: string): Promise<DictionaryResponse[]> {
    try {
      const response = await fetch(`${DICTIONARY_API_BASE_URL}/${encodeURIComponent(word)}?key=${API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DictionaryResponse[] = await response.json();
      return data;
    } catch (error) {
      console.error('获取单词释义失败:', error);
      throw error;
    }
  }
}
