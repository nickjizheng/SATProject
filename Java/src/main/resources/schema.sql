-- Persistent storage required by authentication, practice, saved items, and dashboards.
-- Every statement is idempotent so it is safe to run on each application start.

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    google_subject VARCHAR(255) DEFAULT NULL,
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    status TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email),
    UNIQUE KEY uk_google_subject (google_subject),
    KEY idx_email_verified (email_verified),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_verification_codes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'REGISTER',
    expires_at TIMESTAMP NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_email (email),
    KEY idx_code (code),
    KEY idx_expires_at (expires_at),
    KEY idx_used (used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_token_hash (token_hash),
    KEY idx_expires_at (expires_at),
    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sat_questions (
    id INT NOT NULL,
    original_id VARCHAR(50) DEFAULT NULL,
    domain VARCHAR(100) NOT NULL,
    visuals_type VARCHAR(50) DEFAULT NULL,
    visuals_svg_content LONGTEXT,
    question_text LONGTEXT NOT NULL,
    question_paragraph LONGTEXT,
    question_explanation LONGTEXT,
    choice_a LONGTEXT NOT NULL,
    choice_b LONGTEXT NOT NULL,
    choice_c LONGTEXT NOT NULL,
    choice_d LONGTEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sat_questions_domain (domain),
    KEY idx_sat_questions_correct_answer (correct_answer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sat_question_quality (
    question_id INT NOT NULL,
    quality_status VARCHAR(32) NOT NULL,
    usable TINYINT(1) NOT NULL DEFAULT 0,
    answer_key_source VARCHAR(64) NOT NULL,
    duplicate_of_question_id INT DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (question_id),
    KEY idx_sat_question_quality_usable (usable),
    KEY idx_sat_question_quality_status (quality_status),
    KEY idx_sat_question_quality_duplicate (duplicate_of_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_answer_records (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    question_id INT NOT NULL,
    user_answer VARCHAR(10) DEFAULT NULL,
    is_correct TINYINT(1) DEFAULT NULL,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_user_question (user_id, question_id),
    KEY idx_session_question (session_id, question_id),
    KEY idx_question (question_id),
    KEY idx_answered_at (answered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Immutable event log. user_answer_records remains the compact latest-answer view
-- consumed by the existing dashboard while every submission is retained here.
CREATE TABLE IF NOT EXISTS question_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    submission_id VARCHAR(100) DEFAULT NULL,
    user_id BIGINT DEFAULT NULL,
    session_id VARCHAR(100) DEFAULT NULL,
    question_id INT NOT NULL,
    user_answer CHAR(1) NOT NULL,
    is_correct TINYINT(1) NOT NULL,
    study_mode VARCHAR(40) DEFAULT NULL,
    response_time_ms BIGINT DEFAULT NULL,
    stage_before SMALLINT DEFAULT NULL,
    default_stage SMALLINT DEFAULT NULL,
    default_next_review_at TIMESTAMP NULL DEFAULT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_question_attempt_submission (submission_id),
    KEY idx_question_attempt_user_time (user_id, submitted_at),
    KEY idx_question_attempt_session_time (session_id, submitted_at),
    KEY idx_question_attempt_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_question_review_state (
    user_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    stage SMALLINT NOT NULL DEFAULT 0,
    next_review_at TIMESTAMP NOT NULL,
    last_answered_at TIMESTAMP NOT NULL,
    last_correct TINYINT(1) NOT NULL DEFAULT 0,
    correct_streak INT NOT NULL DEFAULT 0,
    lapse_count INT NOT NULL DEFAULT 0,
    total_attempts INT NOT NULL DEFAULT 1,
    last_attempt_id BIGINT DEFAULT NULL,
    last_grade VARCHAR(10) NOT NULL DEFAULT 'GOOD',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_id),
    KEY idx_review_state_due (user_id, next_review_at),
    KEY idx_review_state_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A small, user-owned planning profile. Scores are goals/context supplied by the
-- learner; they are never inferred from the uncalibrated practice bank.
CREATE TABLE IF NOT EXISTS learning_profiles (
    user_id BIGINT NOT NULL,
    test_date DATE DEFAULT NULL,
    target_score SMALLINT DEFAULT NULL,
    baseline_score SMALLINT DEFAULT NULL,
    available_days VARCHAR(100) NOT NULL,
    daily_minutes SMALLINT NOT NULL DEFAULT 30,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_learning_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learner reflections are deliberately separate from immutable attempts so a
-- student can reclassify or resolve a mistake without rewriting history.
CREATE TABLE IF NOT EXISTS mistake_reflections (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    reason VARCHAR(32) NOT NULL DEFAULT 'UNCLASSIFIED',
    confidence TINYINT DEFAULT NULL,
    note VARCHAR(1000) DEFAULT NULL,
    resolved TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_mistake_reflection_user_question (user_id, question_id),
    KEY idx_mistake_reflection_user_resolved (user_id, resolved),
    KEY idx_mistake_reflection_question (question_id),
    CONSTRAINT fk_mistake_reflections_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_mistake_reflections_question
        FOREIGN KEY (question_id) REFERENCES sat_questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports do not silently change scoring. They create an auditable signal for
-- future human review of weak, unclear, or incomplete source material.
CREATE TABLE IF NOT EXISTS question_reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    question_id INT NOT NULL,
    reason VARCHAR(32) NOT NULL,
    detail VARCHAR(1000) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_question_report_user_question_reason (user_id, question_id, reason),
    KEY idx_question_report_question (question_id),
    KEY idx_question_report_reason (reason),
    CONSTRAINT fk_question_reports_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_question_reports_question
        FOREIGN KEY (question_id) REFERENCES sat_questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing installations only stored one current answer per user/question. Seed a
-- review state once from the newest such record without replacing newer scheduler data.
INSERT IGNORE INTO user_question_review_state (
    user_id, question_id, stage, next_review_at, last_answered_at,
    last_correct, correct_streak, lapse_count, total_attempts, last_grade
)
SELECT
    latest.user_id,
    latest.question_id,
    CASE WHEN latest.is_correct = 1 THEN 1 ELSE 0 END,
    CASE
        WHEN latest.is_correct = 1 THEN DATE_ADD(latest.answered_at, INTERVAL 1 DAY)
        ELSE DATE_ADD(latest.answered_at, INTERVAL 10 MINUTE)
    END,
    latest.answered_at,
    COALESCE(latest.is_correct, 0),
    CASE WHEN latest.is_correct = 1 THEN 1 ELSE 0 END,
    CASE WHEN latest.is_correct = 1 THEN 0 ELSE 1 END,
    1,
    CASE WHEN latest.is_correct = 1 THEN 'GOOD' ELSE 'AGAIN' END
FROM user_answer_records latest
WHERE latest.user_id IS NOT NULL
  AND latest.is_correct IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM user_answer_records newer
      WHERE newer.user_id = latest.user_id
        AND newer.question_id = latest.question_id
        AND (
            newer.answered_at > latest.answered_at
            OR (newer.answered_at = latest.answered_at AND newer.id > latest.id)
        )
  );

CREATE TABLE IF NOT EXISTS favorite_words (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    word VARCHAR(255) NOT NULL,
    word_data JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_word (user_id, word),
    KEY idx_favorite_words_user_id (user_id),
    KEY idx_favorite_words_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorite_questions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    question_data JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_question (user_id, question_id),
    KEY idx_favorite_questions_user_id (user_id),
    KEY idx_favorite_questions_question_id (question_id),
    KEY idx_favorite_questions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
