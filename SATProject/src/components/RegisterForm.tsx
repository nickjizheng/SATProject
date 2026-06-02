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
        content: '请先输入邮箱地址',
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
        content: '请输入有效的邮箱地址',
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
          content: '验证码已发送到您的邮箱，请查收',
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
          content: response.message || '验证码发送失败',
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }
    } catch (err: any) {
      console.error('发送验证码错误:', err);
      let errorMessage = '验证码发送失败，请检查网络连接';
      
      if (err.response?.status === 400) {
        errorMessage = '邮箱格式不正确';
      } else if (err.response?.status === 429) {
        errorMessage = '发送过于频繁，请稍后再试';
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
          content: '注册成功！已自动登录，欢迎加入我们',
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
          content: response.message || '注册失败，请检查输入信息',
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
      }
    } catch (err: any) {
      console.error('注册错误:', err);
      let errorMessage = '注册失败，请检查网络连接';
      
      if (err.response?.status === 400) {
        if (err.response.data?.message?.includes('用户名')) {
          errorMessage = '用户名已存在，请选择其他用户名';
        } else if (err.response.data?.message?.includes('邮箱')) {
          errorMessage = '邮箱已被注册，请使用其他邮箱';
        } else if (err.response.data?.message?.includes('验证码')) {
          errorMessage = '验证码错误或已过期，请重新获取';
        } else {
          errorMessage = err.response.data.message || '输入信息有误，请检查后重试';
        }
      } else if (err.response?.status === 429) {
        errorMessage = '注册请求过于频繁，请稍后再试';
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
            注册并登录
          </Title>
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '1rem',
              fontWeight: 400,
              color: '#666'
            }}
          >
            创建新账户，立即开始使用
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
              { required: true, message: '请输入用户名' },
              { min: 3, max: 50, message: '用户名长度必须在3-50个字符之间' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              placeholder="用户名（3-50个字符）"
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
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#1890ff' }} />}
              placeholder="邮箱地址"
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
              { required: true, message: '请输入密码' },
              { min: 6, max: 20, message: '密码长度必须在6-20个字符之间' }
            ]}
            style={{ marginBottom: '20px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              placeholder="密码（6-20个字符）"
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
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码必须是6位数字' }
            ]}
            style={{ marginBottom: '32px' }}
          >
            <Row gutter={12}>
              <Col flex="auto">
                <Input
                  prefix={<SafetyOutlined style={{ color: '#1890ff' }} />}
                  placeholder="6位验证码"
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
                  {codeLoading ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
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
              {loading ? '注册并登录中...' : '注册并登录'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>
            已有账号？{' '}
            <Button 
              type="link" 
              onClick={onSwitchToLogin} 
              style={{ 
                padding: 0,
                fontWeight: 500,
                color: '#1890ff'
              }}
            >
              直接登录
            </Button>
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default RegisterForm;
