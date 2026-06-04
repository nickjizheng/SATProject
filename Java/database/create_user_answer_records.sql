-- 创建用户答题记录表
CREATE TABLE IF NOT EXISTS user_answer_records (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
    user_id INT COMMENT '用户ID（暂时可以为空，后续集成用户系统）',
    question_id INT NOT NULL COMMENT '题目ID',
    user_answer VARCHAR(10) COMMENT '用户答案 (A, B, C, D)',
    is_correct BOOLEAN COMMENT '是否正确',
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '答题时间',
    session_id VARCHAR(100) COMMENT '会话ID（用于临时用户）',
    INDEX idx_user_question (user_id, question_id),
    INDEX idx_session_question (session_id, question_id),
    INDEX idx_question (question_id),
    INDEX idx_answered_at (answered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户答题记录表';

-- 添加外键约束（可选）
-- ALTER TABLE user_answer_records 
-- ADD CONSTRAINT fk_user_answer_records_question 
-- FOREIGN KEY (question_id) REFERENCES sat_questions(id) 
-- ON DELETE CASCADE;
