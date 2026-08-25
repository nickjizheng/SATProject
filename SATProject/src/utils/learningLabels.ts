import type { MistakeReason, QuestionReportReason } from '../types/learning';

export const mistakeReasonOptions: ReadonlyArray<{
  value: MistakeReason;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  { value: 'CONCEPT_GAP', label: 'Concept gap', shortLabel: 'Concept', description: 'The underlying rule or idea was not secure yet.' },
  { value: 'MISREAD', label: 'Misread', shortLabel: 'Misread', description: 'A word, condition, or part of the prompt was missed.' },
  { value: 'CALCULATION', label: 'Calculation slip', shortLabel: 'Calculation', description: 'The setup was sound, but the execution went off track.' },
  { value: 'PACING', label: 'Pacing pressure', shortLabel: 'Pacing', description: 'Time pressure changed the way the question was handled.' },
  { value: 'GUESS', label: 'Guess', shortLabel: 'Guess', description: 'There was not enough confidence to choose deliberately.' },
];

export const questionReportOptions: ReadonlyArray<{
  value: QuestionReportReason;
  label: string;
  description: string;
}> = [
  { value: 'WRONG_KEY', label: 'Answer key looks wrong', description: 'The marked answer appears inconsistent with the prompt or reasoning.' },
  { value: 'UNCLEAR', label: 'Wording is unclear', description: 'The question, choices, or explanation feel ambiguous.' },
  { value: 'MISSING_VISUAL', label: 'Visual is missing or broken', description: 'A chart, image, table, or diagram is unavailable.' },
  { value: 'DUPLICATE', label: 'Possible duplicate', description: 'This appears to repeat another practice item.' },
  { value: 'OTHER', label: 'Something else', description: 'There is another content or display problem.' },
];

export const getMistakeReasonLabel = (reason: MistakeReason | string | null | undefined) => {
  if (!reason || reason === 'UNCLASSIFIED') return 'Not reflected yet';
  return mistakeReasonOptions.find(option => option.value === reason)?.label || reason.replaceAll('_', ' ').toLowerCase();
};
