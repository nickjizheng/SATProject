# FoodSale Java 项目

## 数据库建表语句

### 好友表 (friend)
```sql
CREATE TABLE `friend` (
  `email` varchar(255) NOT NULL COMMENT '用户邮件',
  `friend_email` varchar(255) NOT NULL COMMENT '好友邮件',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`email`,`friend_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 群组日期表 (group_date)
```sql
CREATE TABLE `group_date` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `date` date NOT NULL COMMENT '日期',
  `type` varchar(10) NOT NULL COMMENT '类型',
  `content` varchar(255) NOT NULL COMMENT '内容',
  `group_id` varchar(255) NOT NULL COMMENT '群id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 群组信息表 (group_info)
```sql
CREATE TABLE `group_info` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '群id',
  `name` varchar(20) NOT NULL COMMENT '群名',
  `host` varchar(255) NOT NULL COMMENT '群主名',
  `description` varchar(255) DEFAULT NULL COMMENT '群介绍 ',
  `invitationCode` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 群组成员表 (group_member)
```sql
CREATE TABLE `group_member` (
  `group_id` int NOT NULL COMMENT '群id',
  `user_email` varchar(255) NOT NULL COMMENT '用户名',
  PRIMARY KEY (`group_id`,`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 群组聊天记录表 (group_record)
```sql
CREATE TABLE `group_record` (
  `recordId` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `content` varchar(255) NOT NULL COMMENT '内容',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '时间',
  `sender_email` varchar(255) NOT NULL COMMENT '发送者',
  `group_id` int NOT NULL COMMENT '群',
  PRIMARY KEY (`recordId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 私聊消息表 (message)
```sql
CREATE TABLE `message` (
  `recordId` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `content` varchar(255) NOT NULL COMMENT '内容',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '时间',
  `sender_email` varchar(255) NOT NULL COMMENT '发送者',
  `receiver_email` varchar(255) NOT NULL COMMENT '接收者',
  `hasRead` int NOT NULL DEFAULT '0' COMMENT '是否已读',
  PRIMARY KEY (`recordId`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 任务表 (tasks)
```sql
CREATE TABLE `tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '任务ID，主键',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务标题',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '任务描述',
  `assignee` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '负责人',
  `deadline` date DEFAULT NULL COMMENT '截止日期',
  `status` enum('pending','in_progress','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '任务状态：待开始/进行中/已完成',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci DEFAULT 'medium' COMMENT '优先级：低/中/高',
  `group_id` bigint DEFAULT NULL COMMENT '所属群组ID，关联群组表',
  PRIMARY KEY (`id`),
  KEY `idx_assignee` (`assignee`),
  KEY `idx_status` (`status`),
  KEY `idx_deadline` (`deadline`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';
```

### 文件信息表 (file_info)
```sql
CREATE TABLE `file_info` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `file_name` varchar(255) NOT NULL COMMENT '存储文件名（UUID）',
  `original_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件存储路径',
  `file_size` bigint(20) NOT NULL COMMENT '文件大小（字节）',
  `file_type` varchar(100) DEFAULT NULL COMMENT '文件类型（MIME类型）',
  `uploader` varchar(100) NOT NULL COMMENT '上传者',
  `group_id` int(11) NOT NULL COMMENT '所属群组ID',
  `upload_time` datetime NOT NULL COMMENT '上传时间',
  `download_url` varchar(500) DEFAULT NULL COMMENT '下载链接',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_uploader` (`uploader`),
  KEY `idx_upload_time` (`upload_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件信息表';
```

### 用户表 (user)
```sql
CREATE TABLE `user` (
  `identity` varchar(20) NOT NULL COMMENT '用户身份',
  `username` varchar(255) NOT NULL COMMENT '用户名',
  `school` varchar(255) NOT NULL COMMENT '学校',
  `email` varchar(255) NOT NULL COMMENT '电子邮箱',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `gender` enum('male','female') NOT NULL COMMENT '性别：male-男，female-女',
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 验证码表 (verify)
```sql
CREATE TABLE `verify` (
  `email` varchar(255) NOT NULL COMMENT '邮箱',
  `code` varchar(10) NOT NULL COMMENT '验证码',
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## 项目说明

这是一个基于Spring Boot的聊天应用后端项目，包含用户管理、好友系统、群组聊天、任务管理、文件共享等功能。

## 技术栈

- Spring Boot
- MyBatis
- MySQL
- WebSocket

## 运行说明

1. 确保已安装Java 8+和Maven
2. 配置数据库连接信息
3. 执行上述建表语句
4. 运行 `mvn spring-boot:run` 启动应用
