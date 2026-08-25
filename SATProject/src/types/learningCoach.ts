export type EvidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface LearningProfile {
  testDate: string | null;
  targetScore: number | null;
  baselineScore: number | null;
  availableDays: Weekday[];
  dailyMinutes: number;
}

export interface DomainReadiness {
  domain: string;
  attempts: number;
  correctAttempts: number;
  accuracyPercent: number;
  averageResponseTimeMs: number | null;
  evidenceLevel: EvidenceLevel;
  trendPercent: number | null;
}

export interface ReadinessSnapshot {
  overallEvidenceLevel: EvidenceLevel;
  domains: DomainReadiness[];
}
