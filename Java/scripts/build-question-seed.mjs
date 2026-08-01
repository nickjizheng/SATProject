import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '../..');
const questionsPath = resolve(projectRoot, 'answer-key-pipeline/data/questions.jsonl');
const acceptedKeysPath = resolve(projectRoot, 'Java/database/apply_llm_answer_keys.sql');
const outputPath = resolve(projectRoot, 'Java/src/main/resources/data/sat-questions.jsonl');

const [questionsText, acceptedKeysSql] = await Promise.all([
  readFile(questionsPath, 'utf8'),
  readFile(acceptedKeysPath, 'utf8'),
]);

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

for (const line of questionsText.split(/\r?\n/)) {
  if (!line.trim()) continue;

  const question = JSON.parse(line);
  if (seenIds.has(question.id)) {
    throw new Error(`Duplicate question ID ${question.id}.`);
  }
  seenIds.add(question.id);

  const currentKey = typeof question.current_answer_key === 'string'
    ? question.current_answer_key.trim().toUpperCase()
    : '';
  const hasVerifiedKey = /^[A-D]$/.test(currentKey);
  const correctAnswer = hasVerifiedKey ? currentKey : acceptedKeys.get(question.id);

  if (!correctAnswer) {
    throw new Error(`Question ${question.id} has no accepted answer key.`);
  }
  if (hasVerifiedKey) preservedVerifiedKeys += 1;

  delete question.current_answer_key;
  outputRows.push(JSON.stringify({ ...question, correct_answer: correctAnswer }));
}

for (const questionId of acceptedKeys.keys()) {
  if (!seenIds.has(questionId)) {
    throw new Error(`Accepted answer key references unknown question ${questionId}.`);
  }
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${outputRows.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  questions: outputRows.length,
  acceptedKeys: acceptedKeys.size,
  preservedVerifiedKeys,
  outputPath,
}, null, 2));
