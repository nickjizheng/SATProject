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
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  timestamp?: number;
}
