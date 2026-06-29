ALTER TABLE `users`
  ADD COLUMN `google_subject` varchar(255) DEFAULT NULL COMMENT 'Google account subject identifier' AFTER `password`,
  ADD UNIQUE KEY `uk_google_subject` (`google_subject`);
