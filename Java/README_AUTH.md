# FoodSale 用户认证系统

## 系统概述

这是一个基于Spring Boot + MyBatis-Plus + MySQL的用户认证系统，支持用户注册、登录、邮箱验证等功能。

## 功能特性

- 用户注册（用户名、邮箱、密码）
- 用户登录（JWT Token认证）
- 邮箱验证码验证
- 密码加密存储
- JWT Token管理
- 跨域支持

## 技术栈

- Spring Boot 3.3.1
- MyBatis-Plus 3.5.5
- MySQL 8.0
- JWT Token
- Spring Security Crypto
- Spring Boot Mail

## 数据库配置

### 1. 创建数据库

执行 `database/create_tables.sql` 文件中的SQL语句来创建数据库和表结构。

### 2. 数据库表结构

- `user`: 用户基本信息表
- `user_login_log`: 用户登录日志表
- `user_session`: 用户会话管理表

## API接口

### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456",
  "confirmPassword": "123456",
  "nickname": "测试用户",
  "phone": "13800138000"
}
```

### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456"
}
```

### 邮箱验证
```
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "test@example.com",
  "verificationCode": "1234"
}
```

### 重新发送验证码
```
POST /api/auth/resend-verification?email=test@example.com
```

## 配置说明

### 1. 数据库配置
在 `application.yml` 中配置MySQL连接信息：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/sale?allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
```

### 2. 邮件配置
在 `application.yml` 中配置邮件服务：
```yaml
spring:
  mail:
    host: smtp.163.com
    username: your_email@163.com
    password: your_email_password
    protocol: smtp
    port: 465
    sslEnable: true
```

## 启动说明

1. 确保MySQL服务已启动
2. 执行数据库建表SQL
3. 修改配置文件中的数据库和邮件配置
4. 运行 `Application.java` 主类
5. 服务将在 `http://localhost:8080` 启动

## 安全特性

- 密码使用BCrypt加密存储
- JWT Token认证
- 邮箱验证码验证
- 验证码10分钟有效期
- 防止重复注册

## 注意事项

1. 首次注册后需要验证邮箱才能正常使用
2. JWT Token有效期为24小时
3. 刷新Token有效期为7天
4. 验证码有效期为10分钟
5. 支持重新发送验证码功能

## 测试账号

系统预置了两个测试账号：
- 用户名：admin，密码：123456
- 用户名：testuser，密码：123456

这些账号的密码都是加密后的值，可以直接用于测试。
