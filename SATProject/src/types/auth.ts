// 认证相关的类型定义

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  verificationCode: string;
}

export interface SendVerificationCodeRequest {
  email: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
  emailVerified: boolean;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}
