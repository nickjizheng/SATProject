import type { ApiResponse } from '../types/sat';
import { API_BASE_URL as API_ROOT } from './apiConfig';

const API_BASE_URL = `${API_ROOT}/dashboard`;

export interface UserStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  favoriteQuestions: number;
  favoriteWords: number;
  studyStreak: number;
  lastStudyDate: string | null;
  averageScore: number;
  domainStats: DomainStat[];
}

export interface DomainStat {
  domain: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  averageScore: number;
}

export interface RecentActivity {
  id: number;
  type: 'question_answered' | 'favorite_added' | 'word_searched' | 'login';
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface StudyProgress {
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  studyTime: number; // in minutes
}

export class DashboardService {
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!token || !user?.id) {
      throw new Error('User is not logged in.');
    }

    return {
      Authorization: `Bearer ${token}`,
      'X-User-Id': user.id.toString(),
    };
  }

  static async getUserStats(): Promise<UserStats> {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const result: ApiResponse<any> = await response.json();

    if (!response.ok || result.code !== 200 || !result.data) {
      throw new Error(result.message || 'Failed to fetch user statistics.');
    }

    const backendData = result.data;
    return {
      totalQuestions: Number(backendData.totalQuestions ?? 0),
      answeredQuestions: Number(backendData.answeredQuestions ?? 0),
      correctAnswers: Number(backendData.correctAnswers ?? 0),
      favoriteQuestions: Number(backendData.favoriteQuestions ?? 0),
      favoriteWords: Number(backendData.favoriteWords ?? 0),
      studyStreak: Number(backendData.studyStreak ?? 0),
      lastStudyDate: backendData.lastStudyDate ?? null,
      averageScore: Number(backendData.averageScore ?? 0),
      domainStats: Array.isArray(backendData.domainStats) ? backendData.domainStats : [],
    };
  }

  static async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const response = await fetch(`${API_BASE_URL}/activities?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const result: ApiResponse<any[]> = await response.json();

    if (!response.ok || result.code !== 200 || !Array.isArray(result.data)) {
      throw new Error(result.message || 'Failed to fetch recent activity.');
    }

    return result.data.map((item: any) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      timestamp: item.timestamp,
      metadata: item.metadata,
    }));
  }

  static async getStudyProgress(days: number = 7): Promise<StudyProgress[]> {
    const response = await fetch(`${API_BASE_URL}/progress?days=${days}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const result: ApiResponse<any[]> = await response.json();

    if (!response.ok || result.code !== 200 || !Array.isArray(result.data)) {
      throw new Error(result.message || 'Failed to fetch study progress.');
    }

    return result.data.map((item: any) => ({
      date: item.date,
      questionsAnswered: Number(item.questionsAnswered ?? 0),
      correctAnswers: Number(item.correctAnswers ?? 0),
      studyTime: Number(item.studyTime ?? 0),
    }));
  }
}
