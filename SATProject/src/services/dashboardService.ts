import type { ApiResponse } from '../types/sat';

const API_BASE_URL = 'http://localhost:8080/api/dashboard';

export interface UserStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  favoriteQuestions: number;
  favoriteWords: number;
  studyStreak: number;
  lastStudyDate: string;
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
  /**
   * 获取用户学习统计
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!token || !user) {
        throw new Error('User is not logged in.');
      }

      const response = await fetch(`${API_BASE_URL}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user.id.toString(),
        },
      });

      const result: ApiResponse<any> = await response.json();

      if (result.code === 200 && result.data) {
        // 转换后端数据格式为前端格式
        const backendData = result.data;
        return {
          totalQuestions: backendData.totalQuestions || 0,
          answeredQuestions: backendData.answeredQuestions || 0,
          correctAnswers: backendData.correctAnswers || 0,
          favoriteQuestions: backendData.favoriteQuestions || 0,
          favoriteWords: backendData.favoriteWords || 0,
          studyStreak: backendData.studyStreak || 0,
          lastStudyDate: backendData.lastStudyDate || new Date().toISOString(),
          averageScore: backendData.averageScore || 0,
          domainStats: backendData.domainStats || []
        };
      } else {
        throw new Error('Failed to fetch user statistics.');
      }
    } catch (error) {
      console.error('Failed to fetch user statistics:', error);
      throw error;
    }
  }

  /**
   * 获取最近活动
   */
  static async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!token || !user) {
        throw new Error('User is not logged in.');
      }

      const response = await fetch(`${API_BASE_URL}/activities?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user.id.toString(),
        },
      });

      const result: ApiResponse<any[]> = await response.json();

      if (result.code === 200 && result.data) {
        // 转换后端数据格式为前端格式
        return result.data.map((item: any) => ({
          id: item.id,
          type: item.type,
          description: item.description,
          timestamp: item.timestamp,
          metadata: item.metadata
        }));
      } else {
        throw new Error('Failed to fetch recent activity.');
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      throw error;
    }
  }

  /**
   * 获取学习进度数据
   */
  static async getStudyProgress(days: number = 7): Promise<StudyProgress[]> {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!token || !user) {
        throw new Error('User is not logged in.');
      }

      const response = await fetch(`${API_BASE_URL}/progress?days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user.id.toString(),
        },
      });

      const result: ApiResponse<any[]> = await response.json();

      if (result.code === 200 && result.data) {
        // 转换后端数据格式为前端格式
        return result.data.map((item: any) => ({
          date: item.date,
          questionsAnswered: item.questionsAnswered || 0,
          correctAnswers: item.correctAnswers || 0,
          studyTime: item.studyTime || 0
        }));
      } else {
        throw new Error('Failed to fetch study progress.');
      }
    } catch (error) {
      console.error('Failed to fetch study progress:', error);
      throw error;
    }
  }
}
