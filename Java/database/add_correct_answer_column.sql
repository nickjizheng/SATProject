-- 为SAT题目表添加正确答案字段
-- 这个脚本会添加一个correct_answer字段来存储正确答案

ALTER TABLE sat_questions 
ADD COLUMN correct_answer VARCHAR(10) COMMENT '正确答案 (A, B, C, D)' 
AFTER choice_d;

-- 添加索引以提高查询性能
CREATE INDEX idx_sat_questions_domain ON sat_questions(domain);
CREATE INDEX idx_sat_questions_correct_answer ON sat_questions(correct_answer);

-- 示例：更新一些题目的正确答案（请根据实际数据调整）
-- UPDATE sat_questions SET correct_answer = 'A' WHERE id = 1;
-- UPDATE sat_questions SET correct_answer = 'B' WHERE id = 2;
-- UPDATE sat_questions SET correct_answer = 'C' WHERE id = 3;
-- UPDATE sat_questions SET correct_answer = 'D' WHERE id = 4;
