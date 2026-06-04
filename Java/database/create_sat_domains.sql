-- 创建SAT领域表
CREATE TABLE IF NOT EXISTS sat_domains (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
    domain_code VARCHAR(50) NOT NULL UNIQUE COMMENT '领域代码',
    domain_name VARCHAR(100) NOT NULL COMMENT '领域名称',
    description TEXT COMMENT '领域描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SAT领域表';

-- 插入预定义的SAT领域数据
INSERT INTO sat_domains (domain_code, domain_name, description) VALUES
('math', 'Math', 'SAT Math section including algebra, geometry, data analysis, etc.'),
('english', 'English', 'SAT English section including reading, writing, grammar, etc.'),
('practice_test', 'Practice Test', 'Complete SAT practice test questions'),
('reading', 'Reading', 'SAT reading comprehension and analysis'),
('writing', 'Writing', 'SAT writing and language expression'),
('grammar', 'Grammar', 'SAT grammar and language usage')
ON DUPLICATE KEY UPDATE 
domain_name = VALUES(domain_name),
description = VALUES(description),
updated_at = CURRENT_TIMESTAMP;

-- 为sat_questions表添加外键约束（可选）
-- ALTER TABLE sat_questions 
-- ADD CONSTRAINT fk_sat_questions_domain 
-- FOREIGN KEY (domain) REFERENCES sat_domains(domain_code) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

-- 创建索引以提高查询性能
CREATE INDEX idx_sat_domains_code ON sat_domains(domain_code);
CREATE INDEX idx_sat_domains_name ON sat_domains(domain_name);
