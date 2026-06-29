-- Audit answer-key coverage before enabling scored practice.
SELECT
  COUNT(*) AS total_questions,
  SUM(UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D')) AS verified_questions,
  SUM(correct_answer IS NULL OR TRIM(correct_answer) = '') AS missing_keys,
  SUM(correct_answer IS NOT NULL
      AND TRIM(correct_answer) <> ''
      AND UPPER(TRIM(correct_answer)) NOT IN ('A', 'B', 'C', 'D')) AS invalid_keys
FROM sat_questions;

-- Recover only keys stated explicitly and unambiguously in an explanation.
-- A row is updated only when exactly one choice is described as correct/best.
UPDATE sat_questions
SET correct_answer = CASE
  WHEN LOWER(question_explanation) REGEXP 'choice[[:space:]]+a[[:space:]]+is[[:space:]]+(the[[:space:]]+)?(correct|best[[:space:]]+answer)' THEN 'A'
  WHEN LOWER(question_explanation) REGEXP 'choice[[:space:]]+b[[:space:]]+is[[:space:]]+(the[[:space:]]+)?(correct|best[[:space:]]+answer)' THEN 'B'
  WHEN LOWER(question_explanation) REGEXP 'choice[[:space:]]+c[[:space:]]+is[[:space:]]+(the[[:space:]]+)?(correct|best[[:space:]]+answer)' THEN 'C'
  WHEN LOWER(question_explanation) REGEXP 'choice[[:space:]]+d[[:space:]]+is[[:space:]]+(the[[:space:]]+)?(correct|best[[:space:]]+answer)' THEN 'D'
END
WHERE (correct_answer IS NULL OR TRIM(correct_answer) = '')
  AND question_explanation IS NOT NULL
  AND (
    (LOWER(question_explanation) REGEXP 'choice[[:space:]]+a[[:space:]]+is[[:space:]]+(the[[:space:]]+)?(correct|best[[:space:]]+answer)') +
    (LOWER(question_explanation) REGEXP 'choice[[:space:]]+b[[:space:]]+is[[:space:]]+(the[[:space:]]+)?(correct|best[[:space:]]+answer)') +
    (LOWER(question_explanation) REGEXP 'choice[[:space:]]+c[[:space:]]+is[[:space:]]+(the[[:space:]]+)?(correct|best[[:space:]]+answer)') +
    (LOWER(question_explanation) REGEXP 'choice[[:space:]]+d[[:space:]]+is[[:space:]]+(the[[:space:]]+)?(correct|best[[:space:]]+answer)')
  ) = 1;

-- These rows still need an answer key from the authoritative source.
SELECT id, original_id, domain, question_text
FROM sat_questions
WHERE UPPER(TRIM(correct_answer)) NOT IN ('A', 'B', 'C', 'D')
   OR correct_answer IS NULL
ORDER BY domain, id;
