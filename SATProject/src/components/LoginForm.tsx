import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import type { AuthResponse, LoginRequest } from '../types/auth';
import { authService } from '../services/authService';
import { storeAuthSession } from '../utils/authStorage';
import { toRequestError } from '../utils/requestError';
import GoogleSignInButton from './GoogleSignInButton';

const { Title, Text } = Typography;

interface LoginFormProps {
  onSuccess: (data: AuthResponse) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await authService.login(values);
      if (response.code === 200) {
        storeAuthSession(response.data);

        message.success({
          content: 'Login successful. Welcome back.',
          duration: 2,
          style: {
            marginTop: '20vh',
          },
        });

        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          onSuccess(response.data);
        }, 1000);
      } else {
        const backendMessage = response.message || '';
        let errorMessage = 'Login failed. Please check your username or password.';

        if (backendMessage.includes('User not found')) {
          errorMessage = "Account doesn't exist.";
        } else if (backendMessage.includes('Incorrect password')) {
          errorMessage = 'Password is incorrect.';
        } else if (backendMessage.includes('disabled')) {
          errorMessage = 'This account has been disabled. Please contact an administrator.';
        }

        setFeedback(errorMessage);
        message.error({
          content: errorMessage,
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }
    } catch (error: unknown) {
      const err = toRequestError(error);
      console.error('登录错误:', err);
      let errorMessage = 'Login failed. Please check your network connection.';

      if (err.response?.status === 401) {
        errorMessage = 'Incorrect username or password.';
      } else if (err.response?.status === 403) {
        errorMessage = 'This account has been disabled. Please contact an administrator.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMessage = 'Login failed. Please try again.';
      }

      setFeedback(errorMessage);

      message.error({
        content: errorMessage,
        duration: 4,
        style: {
          marginTop: '20vh',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className="auth-form-card"
      style={{
        width: 480,
        margin: '0 auto',
        borderRadius: '20px',
        border: 'none',
        background: '#fffdf8'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%', padding: '8px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <Title
            level={2}
            className="display-type"
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 700,
              letterSpacing: '-0.01em'
            }}
          >
            Log In
          </Title>
          <Text
            type="secondary"
            style={{
              fontSize: '1rem',
              fontWeight: 400,
              color: '#666'
            }}
          >
            Welcome back. Sign in to your account.
          </Text>
        </div>

        {feedback && (
          <Alert message={feedback} type="error" showIcon />
        )}

        <GoogleSignInButton onSuccess={onSuccess} />
        <Divider plain style={{ margin: '0', color: '#78716c', fontSize: 12 }}>or continue with email</Divider>

        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="usernameOrEmail"
            rules={[
              { required: true, message: 'Please enter your username or email.' },
              { min: 3, message: 'Username must be at least 3 characters.' }
            ]}
            style={{ marginBottom: '24px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#0f766e' }} />}
              placeholder="Username or email"
              style={{
                height: '48px',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter your password.' },
              { min: 6, message: 'Password must be at least 6 characters.' }
            ]}
            style={{ marginBottom: '32px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#0f766e' }} />}
              placeholder="Password"
              style={{
                height: '48px',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: '52px',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                boxShadow: '0 6px 16px rgba(24, 144, 255, 0.3)'
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>
            Don't have an account yet?{' '}
            <Button
              type="link"
              onClick={onSwitchToRegister}
              style={{
                padding: 0,
                fontWeight: 500,
                color: '#1890ff'
              }}
            >
              Sign up
            </Button>
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default LoginForm;
