import axios from 'axios';

// 类型定义
interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  verificationCode: string;
}

interface SendVerificationCodeRequest {
  email: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
  emailVerified: boolean;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // token过期或无效，清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// 认证服务
export const authService = {
  // 发送验证码
  async sendVerificationCode(data: SendVerificationCodeRequest): Promise<ApiResponse<void>> {
    return api.post('/auth/send-verification-code', data);
  },

  // 用户注册
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return api.post('/auth/register', data);
  },

  // 用户登录
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return api.post('/auth/login', data);
  },

  // 用户登出
  async logout(): Promise<ApiResponse<void>> {
    return api.post('/auth/logout');
  },
};

export default api;
