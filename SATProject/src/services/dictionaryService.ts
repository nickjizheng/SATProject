import type { DictionaryResponse } from '../types/dictionary';

const DICTIONARY_API_BASE_URL = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json';
const API_KEY = import.meta.env.VITE_DICTIONARY_API_KEY;

export class DictionaryService {
  /**
   * 获取单词释义
   */
  static async getWordDefinition(word: string): Promise<DictionaryResponse[]> {
    try {
      if (!API_KEY) {
        throw new Error('Dictionary API key is not configured.');
      }

      const response = await fetch(`${DICTIONARY_API_BASE_URL}/${encodeURIComponent(word)}?key=${API_KEY}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: unknown[] = await response.json();

      // Misspellings are returned as suggestion strings, not dictionary entries.
      return data.filter((entry): entry is DictionaryResponse => {
        if (!entry || typeof entry !== 'object') return false;
        const candidate = entry as Partial<DictionaryResponse>;
        return Boolean(candidate.meta && candidate.hwi);
      });
    } catch (error) {
      console.error('获取单词释义失败:', error);
      throw error;
    }
  }
}
