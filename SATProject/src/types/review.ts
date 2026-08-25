import type { SatQuestion } from './sat';

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';
export type ReviewGradeApi = Uppercase<ReviewGrade>;

export interface ReviewSummary {
  dueNow: number;
  learning: number;
  mastered: number;
  totalScheduled: number;
  retentionEstimate: number;
  nextDueAt: string | null;
  reviewedToday: number;
}

export interface ReviewQueueItem {
  question: SatQuestion;
  stage: number;
  dueAt: string;
  intervalMinutes: number;
  reviewCount: number;
  lapseCount: number;
  overdueMinutes: number;
  statusLabel: string;
}

export interface ReviewForecastPoint {
  date: string;
  dueCount: number;
  learning?: number;
  review?: number;
}

export interface ReviewAdjustment {
  questionId: number;
  grade: ReviewGradeApi;
  reviewStage?: number;
  nextReviewAt?: string;
  intervalMinutes?: number;
  statusLabel?: string;
}
