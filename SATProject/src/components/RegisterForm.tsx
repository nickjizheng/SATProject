import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Row, Col, Alert, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import type { AuthResponse, RegisterRequest, SendVerificationCodeRequest } from '../types/auth';
import { authService } from '../services/authService';
import { storeAuthSession } from '../utils/authStorage';
import { toRequestError } from '../utils/requestError';
import GoogleSignInButton from './GoogleSignInButton';

const { Title, Text } = Typography;

interface RegisterFormProps {
  onSuccess: (data: AuthResponse) => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form] = Form.useForm();

  const sendVerificationCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      setFeedback({ type: 'error', message: 'Please enter your email address first.' });
      message.error({
        content: 'Please enter your email address first.',
        duration: 2,
        style: {
          marginTop: '20vh',
        },
      });
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      message.error({
        content: 'Please enter a valid email address.',
        duration: 2,
        style: {
          marginTop: '20vh',
        },
      });
      return;
    }

    setCodeLoading(true);
    setFeedback(null);

    try {
      const request: SendVerificationCodeRequest = { email };
      const response = await authService.sendVerificationCode(request);
      if (response.code === 200) {
        setFeedback({ type: 'success', message: 'Verification code sent. Please check your inbox.' });
        message.success({
          content: 'Verification code sent. Please check your inbox.',
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setFeedback({ type: 'error', message: response.message || 'Failed to send the verification code.' });
        message.error({
          content: response.message || 'Failed to send the verification code.',
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }
    } catch (error: unknown) {
      const err = toRequestError(error);
      console.error('发送验证码错误:', err);
      let errorMessage = 'Failed to send the verification code. Please check your network connection.';
      const backendMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.response?.data?.message;

      if (backendMessage?.includes('already registered')) {
        errorMessage = 'This email is already registered. Please log in instead.';
      } else if (backendMessage?.includes('valid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (backendMessage) {
        errorMessage = backendMessage;
      }

      setFeedback({ type: 'error', message: errorMessage });

      message.error({
        content: errorMessage,
        duration: 4,
        style: {
          marginTop: '20vh',
        },
      });
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (values: RegisterRequest) => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await authService.register(values);
      if (response.code === 200) {
        storeAuthSession(response.data);

        message.success({
          content: 'Account created successfully. You have been signed in automatically.',
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
        let errorMessage = backendMessage || 'Registration failed. Please review your information and try again.';

        if (backendMessage.includes('username is already taken')) {
          errorMessage = 'Username is already taken.';
        } else if (backendMessage.includes('email is already registered')) {
          errorMessage = 'Email already exists.';
        } else if (backendMessage.includes('verification code has expired')) {
          errorMessage = 'Verification code expired.';
        } else if (backendMessage.includes('verification code is invalid')) {
          errorMessage = 'Invalid verification code.';
        }

        setFeedback({ type: 'error', message: errorMessage });
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
      console.error('注册错误:', err);
      let errorMessage = 'Registration failed. Please check your network connection.';
      const backendMessage =
        typeof err === 'string'
          ? err
          : err?.message || err?.response?.data?.message;

      if (backendMessage?.includes('username is already taken') || backendMessage?.includes('username')) {
        errorMessage = 'That username is already taken. Please choose another one.';
      } else if (backendMessage?.includes('email is already registered') || backendMessage?.includes('email')) {
        errorMessage = 'That email is already registered. Please use another email.';
      } else if (backendMessage?.includes('verification code has expired')) {
        errorMessage = 'Verification code expired.';
      } else if (backendMessage?.includes('verification code is invalid')) {
        errorMessage = 'Invalid verification code.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please try again later.';
      } else if (backendMessage) {
        errorMessage = backendMessage;
      }

      setFeedback({ type: 'error', message: errorMessage });

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
            Create Account
          </Title>
          <Text
            type="secondary"
            style={{
              fontSize: '1rem',
              fontWeight: 400,
              color: '#666'
            }}
          >
            Create a new account and get started right away.
          </Text>
        </div>

        {feedback && (
          <Alert message={feedback.message} type={feedback.type} showIcon />
        )}

        <GoogleSignInButton onSuccess={onSuccess} />
        <Divider plain style={{ margin: '0', color: '#78716c', fontSize: 12 }}>or create an account with email</Divider>

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Please enter a username.' },
              { min: 3, max: 50, message: 'Username must be between 3 and 50 characters.' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#0f766e' }} />}
              placeholder="Username (3-50 characters)"
              style={{
                height: '48px',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email address.' },
              { type: 'email', message: 'Please enter a valid email address.' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#0f766e' }} />}
              placeholder="Email address"
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
              { required: true, message: 'Please enter a password.' },
              { min: 6, max: 20, message: 'Password must be between 6 and 20 characters.' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#0f766e' }} />}
              placeholder="Password (6-20 characters)"
              style={{
                height: '48px',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            />
          </Form.Item>

          <Form.Item
            name="verificationCode"
            rules={[
              { required: true, message: 'Please enter the verification code.' },
              { len: 6, message: 'The verification code must be 6 digits.' }
            ]}
            style={{ marginBottom: '32px' }}
          >
            <Row gutter={[12, 12]} className="verification-code-row">
              <Col flex="auto">
                <Input
                  prefix={<SafetyOutlined style={{ color: '#0f766e' }} />}
                  placeholder="6-digit code"
                  maxLength={6}
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    fontSize: '1rem'
                  }}
                />
              </Col>
              <Col>
                <Button
                  onClick={sendVerificationCode}
                  loading={codeLoading}
                  disabled={countdown > 0}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    fontWeight: 500,
                    background: countdown > 0 ? '#f5f5f5' : 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    border: 'none',
                    color: countdown > 0 ? '#999' : 'white',
                    boxShadow: countdown > 0 ? 'none' : '0 4px 12px rgba(82, 196, 26, 0.3)'
                  }}
                >
                  {codeLoading ? 'Sending...' : countdown > 0 ? `${countdown}s` : 'Send Code'}
                </Button>
              </Col>
            </Row>
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
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>
            Already have an account?{' '}
            <Button
              type="link"
              onClick={onSwitchToLogin}
              style={{
                padding: 0,
                fontWeight: 500,
                color: '#1890ff'
              }}
            >
              Log in
            </Button>
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default RegisterForm;
