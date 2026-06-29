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
      // 如果API调用失败，返回模拟数据
      return this.getMockUserStats();
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
      // 如果API调用失败，返回模拟数据
      return this.getMockRecentActivities();
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
      // 如果API调用失败，返回模拟数据
      return this.getMockStudyProgress();
    }
  }

  /**
   * 获取模拟用户统计数据
   */
  private static getMockUserStats(): UserStats {
    return {
      totalQuestions: 2456,
      answeredQuestions: 342,
      correctAnswers: 267,
      favoriteQuestions: 28,
      favoriteWords: 156,
      studyStreak: 7,
      lastStudyDate: new Date().toISOString(),
      averageScore: 78.1,
      domainStats: [
        {
          domain: 'Reading',
          totalQuestions: 800,
          answeredQuestions: 120,
          correctAnswers: 95,
          averageScore: 79.2
        },
        {
          domain: 'Writing',
          totalQuestions: 600,
          answeredQuestions: 98,
          correctAnswers: 78,
          averageScore: 79.6
        },
        {
          domain: 'Math',
          totalQuestions: 1056,
          answeredQuestions: 124,
          correctAnswers: 94,
          averageScore: 75.8
        }
      ]
    };
  }

  /**
   * 获取模拟最近活动数据
   */
  private static getMockRecentActivities(): RecentActivity[] {
    const now = new Date();
    return [
      {
        id: 1,
        type: 'question_answered',
        description: 'Completed Math question #1234',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        metadata: { questionId: 1234, correct: true }
      },
      {
        id: 2,
        type: 'favorite_added',
        description: 'Saved the word "serendipity"',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        metadata: { word: 'serendipity' }
      },
      {
        id: 3,
        type: 'question_answered',
        description: 'Completed Reading question #1233',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        metadata: { questionId: 1233, correct: false }
      },
      {
        id: 4,
        type: 'favorite_added',
        description: 'Saved question #1232',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        metadata: { questionId: 1232 }
      },
      {
        id: 5,
        type: 'login',
        description: 'Logged in',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      }
    ];
  }

  /**
   * 获取模拟学习进度数据
   */
  private static getMockStudyProgress(): StudyProgress[] {
    const data: StudyProgress[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toISOString().split('T')[0],
        questionsAnswered: Math.floor(Math.random() * 20) + 5,
        correctAnswers: Math.floor(Math.random() * 15) + 3,
        studyTime: Math.floor(Math.random() * 60) + 15
      });
    }

    return data;
  }
}
