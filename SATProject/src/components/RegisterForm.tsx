import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import type { RegisterRequest, SendVerificationCodeRequest } from '../types/auth';
import { authService } from '../services/authService';

const { Title, Text } = Typography;

interface RegisterFormProps {
  onSuccess: (data: any) => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();

  const sendVerificationCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
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

    try {
      const request: SendVerificationCodeRequest = { email };
      const response = await authService.sendVerificationCode(request);
      if (response.code === 200) {
        message.success({
          content: 'The verification code was sent to your email.',
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
        message.error({
          content: response.message || 'Failed to send the verification code.',
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }
    } catch (err: any) {
      console.error('Verification code error:', err);
      let errorMessage = 'Failed to send the verification code. Check your connection.';

      if (err.response?.status === 400) {
        errorMessage = 'The email address is invalid.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Please wait before requesting another code.';
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
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (values: RegisterRequest) => {
    setLoading(true);

    try {
      const response = await authService.register(values);
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
          content: 'Registration successful. You are now logged in.',
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
          content: response.message || 'Registration failed. Check your information.',
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'Registration failed. Check your network connection.';

      if (err.response?.status === 400) {
        if (err.response.data?.message?.includes('用户名')) {
          errorMessage = 'That username is already taken.';
        } else if (err.response.data?.message?.includes('邮箱')) {
          errorMessage = 'That email address is already registered.';
        } else if (err.response.data?.message?.includes('验证码')) {
          errorMessage = 'The verification code is incorrect or expired.';
        } else {
          errorMessage = err.response.data.message || 'Check your information and try again.';
        }
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please try again later.';
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
            Sign Up
          </Title>
          <Text
            type="secondary"
            style={{
              fontSize: '1rem',
              fontWeight: 400,
              color: '#666'
            }}
          >
            Create an account and start practicing.
          </Text>
        </div>

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
              { min: 3, max: 50, message: 'Username must be 3-50 characters.' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
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
              { required: true, message: 'Please enter your email.' },
              { type: 'email', message: 'Please enter a valid email address.' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#1890ff' }} />}
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
              { min: 6, max: 20, message: 'Password must be 6-20 characters.' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
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
              { len: 6, message: 'The verification code must contain 6 digits.' }
            ]}
            style={{ marginBottom: '32px' }}
          >
            <Row gutter={12}>
              <Col flex="auto">
                <Input
                  prefix={<SafetyOutlined style={{ color: '#1890ff' }} />}
                  placeholder="6-digit verification code"
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
              {loading ? 'Creating account...' : 'Sign Up'}
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
