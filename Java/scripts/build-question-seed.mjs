import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '../..');
const questionsPath = resolve(projectRoot, 'answer-key-pipeline/data/questions.jsonl');
const candidatesPath = resolve(projectRoot, 'answer-key-pipeline/outputs/candidates-14b-rerun.jsonl');
const acceptedKeysPath = resolve(projectRoot, 'Java/database/apply_llm_answer_keys.sql');
const outputPath = resolve(projectRoot, 'Java/src/main/resources/data/sat-questions.jsonl');

const [questionsText, candidatesText, acceptedKeysSql] = await Promise.all([
  readFile(questionsPath, 'utf8'),
  readFile(candidatesPath, 'utf8'),
  readFile(acceptedKeysPath, 'utf8'),
]);

const candidates = new Map();
for (const line of candidatesText.split(/\r?\n/)) {
  if (!line.trim()) continue;

  const candidate = JSON.parse(line);
  if (candidates.has(candidate.question_id)) {
    throw new Error(`Duplicate 14B rerun candidate for question ${candidate.question_id}.`);
  }
  candidates.set(candidate.question_id, candidate);
}

const acceptedKeys = new Map();
for (const match of acceptedKeysSql.matchAll(/\((\d+),\s*'([A-D])'\)/g)) {
  const questionId = Number(match[1]);
  if (acceptedKeys.has(questionId)) {
    throw new Error(`Duplicate accepted answer key for question ${questionId}.`);
  }
  acceptedKeys.set(questionId, match[2]);
}

const seenIds = new Set();
const outputRows = [];
let preservedVerifiedKeys = 0;
let autoApprovedKeys = 0;
let quarantinedKeys = 0;
let duplicateQuestions = 0;

function contentFingerprint(question) {
  // Identity and answer-key provenance are intentionally excluded: two records with
  // byte-for-byte equivalent student-facing content are the same bank question.
  return JSON.stringify({
    domain: question.domain,
    visuals_type: question.visuals_type,
    visuals_svg_content: question.visuals_svg_content,
    question_text: question.question_text,
    question_paragraph: question.question_paragraph,
    answer_explanation: question.answer_explanation,
    choices: question.choices,
  });
}

function rawQualityStatus(question) {
  const currentKey = typeof question.current_answer_key === 'string'
    ? question.current_answer_key.trim().toUpperCase()
    : '';
  return /^[A-D]$/.test(currentKey)
    ? 'source_provided'
    : candidates.get(question.id)?.status;
}

const qualityPriority = new Map([
  ['source_provided', 4],
  ['auto_approved', 3],
  ['needs_review', 2],
  ['error', 1],
]);
const questions = questionsText.split(/\r?\n/)
  .filter(line => line.trim())
  .map(line => JSON.parse(line));
const contentOwners = new Map();
for (const question of questions) {
  const fingerprint = contentFingerprint(question);
  const currentOwner = contentOwners.get(fingerprint);
  const questionPriority = qualityPriority.get(rawQualityStatus(question)) ?? 0;
  const ownerPriority = currentOwner == null
    ? -1
    : qualityPriority.get(rawQualityStatus(currentOwner)) ?? 0;
  if (currentOwner == null
      || questionPriority > ownerPriority
      || (questionPriority === ownerPriority && question.id < currentOwner.id)) {
    contentOwners.set(fingerprint, question);
  }
}

for (const question of questions) {
  if (seenIds.has(question.id)) {
    throw new Error(`Duplicate question ID ${question.id}.`);
  }
  seenIds.add(question.id);

  const currentKey = typeof question.current_answer_key === 'string'
    ? question.current_answer_key.trim().toUpperCase()
    : '';
  const hasVerifiedKey = /^[A-D]$/.test(currentKey);
  const candidate = candidates.get(question.id);
  const candidateKey = typeof candidate?.answer_key === 'string'
    ? candidate.answer_key.trim().toUpperCase()
    : '';
  const acceptedKey = acceptedKeys.get(question.id);
  const correctAnswer = hasVerifiedKey
    ? currentKey
    : (/^[A-D]$/.test(candidateKey) ? candidateKey : acceptedKey);

  if (!correctAnswer) {
    throw new Error(`Question ${question.id} has no accepted answer key.`);
  }
  if (!hasVerifiedKey && !candidate) {
    throw new Error(`Question ${question.id} has no candidates-14b-rerun quality result.`);
  }
  if (hasVerifiedKey && candidate) {
    throw new Error(`Source-keyed question ${question.id} unexpectedly has a 14B rerun candidate.`);
  }
  if (acceptedKey && /^[A-D]$/.test(candidateKey) && acceptedKey !== candidateKey) {
    throw new Error(`Accepted key and 14B rerun disagree for question ${question.id}.`);
  }

  let qualityStatus;
  let answerKeySource;
  if (hasVerifiedKey) {
    qualityStatus = 'source_provided';
    answerKeySource = 'source';
    preservedVerifiedKeys += 1;
  } else {
    qualityStatus = candidate.status;
    answerKeySource = /^[A-D]$/.test(candidateKey) ? 'candidates-14b-rerun' : 'manual_fallback';
    if (qualityStatus === 'auto_approved') autoApprovedKeys += 1;
  }

  if (!['source_provided', 'auto_approved', 'needs_review', 'error'].includes(qualityStatus)) {
    throw new Error(`Question ${question.id} has unsupported quality status: ${qualityStatus}.`);
  }

  const fingerprint = contentFingerprint(question);
  const ownerQuestionId = contentOwners.get(fingerprint).id;
  const duplicateOfQuestionId = ownerQuestionId === question.id ? null : ownerQuestionId;
  if (duplicateOfQuestionId != null) {
    qualityStatus = 'duplicate';
    duplicateQuestions += 1;
  }

  if (!['source_provided', 'auto_approved'].includes(qualityStatus)) {
    quarantinedKeys += 1;
  }

  delete question.current_answer_key;
  outputRows.push(JSON.stringify({
    ...question,
    correct_answer: correctAnswer,
    quality_status: qualityStatus,
    answer_key_source: answerKeySource,
    duplicate_of_question_id: duplicateOfQuestionId,
  }));
}

for (const questionId of acceptedKeys.keys()) {
  if (!seenIds.has(questionId)) {
    throw new Error(`Accepted answer key references unknown question ${questionId}.`);
  }
}
for (const questionId of candidates.keys()) {
  if (!seenIds.has(questionId)) {
    throw new Error(`14B rerun candidate references unknown question ${questionId}.`);
  }
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${outputRows.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  questions: outputRows.length,
  acceptedKeys: acceptedKeys.size,
  preservedVerifiedKeys,
  autoApprovedKeys,
  duplicateQuestions,
  usableQuestions: outputRows.length - quarantinedKeys,
  quarantinedQuestions: quarantinedKeys,
  outputPath,
}, null, 2));
