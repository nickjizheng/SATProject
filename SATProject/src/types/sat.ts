// SAT题目相关类型定义

export interface SatQuestion {
  id: number;
  originalId?: string;
  domain?: string;
  visualsType?: string;
  visualsSvgContent?: string;
  questionText?: string;
  questionParagraph?: string;
  choiceA?: string;
  choiceB?: string;
  choiceC?: string;
  choiceD?: string;
}

export interface AnswerRequest {
  questionId: number;
  answer: string; // A, B, C, D
  sessionId: string; // 会话ID
  submissionId?: string;
  studyMode?: 'practice' | 'quick' | 'review' | 'favorite' | 'pacing';
  responseTimeMs?: number;
}

export interface NextQuestionRequest {
  sessionId: string;
  domain?: string;
}

export interface NextQuestionResponse {
  question?: SatQuestion;
  hasMoreQuestions: boolean;
  answeredCount: number;
  totalCount: number;
}

export interface AnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  explanation?: string;
  questionId: number;
  reviewStage?: number;
  nextReviewAt?: string;
  intervalMinutes?: number;
}

export interface SatBankSummary {
  totalQuestions: number;
  usableQuestions: number;
  quarantinedQuestions: number;
  duplicateQuestions: number;
  byDomain: Record<string, number>;
  byQualityStatus: Record<string, number>;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  timestamp?: number;
}
