import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import type { LoginRequest } from '../types/auth';
import { authService } from '../services/authService';

const { Title, Text } = Typography;

interface LoginFormProps {
  onSuccess: (data: any) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true);

    try {
      const response = await authService.login(values);
      if (response.code === 200) {
        // 保存token和用户信息到localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.userId,
          username: response.data.username,
          email: response.data.email,
          emailVerified: response.data.emailVerified
        }));

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
        message.error({
          content: response.message || 'Login failed. Check your username and password.',
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Check your network connection.';

      if (err.response?.status === 401) {
        errorMessage = 'Incorrect username or password.';
      } else if (err.response?.status === 403) {
        errorMessage = 'This account has been disabled.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

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
      className="animate-fade-in-scale shadow-elevated"
      style={{
        width: 480,
        margin: '0 auto',
        borderRadius: '20px',
        border: 'none',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%', padding: '8px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <Title
            level={2}
            className="gradient-text"
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
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
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
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
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
            Don't have an account?{' '}
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
