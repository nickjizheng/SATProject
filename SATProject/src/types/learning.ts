export type MistakeReason =
  | 'UNCLASSIFIED'
  | 'CONCEPT_GAP'
  | 'MISREAD'
  | 'CALCULATION'
  | 'PACING'
  | 'GUESS';

export type QuestionReportReason =
  | 'WRONG_KEY'
  | 'UNCLEAR'
  | 'MISSING_VISUAL'
  | 'DUPLICATE'
  | 'OTHER';

export interface MistakeChoices {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
}

export interface MistakeRecord {
  questionId: number;
  domain?: string;
  visualsType?: string;
  visualsSvgContent?: string;
  questionText?: string;
  questionParagraph?: string;
  choices: MistakeChoices;
  correctAnswer: string;
  explanation?: string;
  selectedAnswer: string;
  responseTimeMs?: number | null;
  occurredAt: string;
  reason: MistakeReason;
  confidence?: number | null;
  note?: string | null;
  resolved: boolean;
}

export interface MistakePattern {
  reason: MistakeReason;
  count: number;
}

export interface MistakeDomainPattern {
  domain: string;
  count: number;
}

export interface MistakeSummary {
  unresolvedTotal: number;
  byReason: MistakePattern[];
  byDomain: MistakeDomainPattern[];
}

export interface MistakeFilters {
  reason?: MistakeReason;
  domain?: string;
  resolved?: boolean;
  limit?: number;
}

export interface MistakeReflectionUpdate {
  reason: MistakeReason;
  confidence?: number | null;
  note?: string;
  resolved: boolean;
}

export interface QuestionReportRequest {
  reason: QuestionReportReason;
  detail?: string;
}
