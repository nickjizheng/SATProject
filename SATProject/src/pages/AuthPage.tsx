import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const { Content } = Layout;

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleAuthSuccess = (data: any) => {
    console.log('认证成功:', data);
    // 认证成功后跳转到首页
    navigate('/home');
  };

  const switchToRegister = () => {
    setIsLogin(false);
    navigate('/auth?mode=register');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    navigate('/auth?mode=login');
  };

  return (
    <Layout style={{ 
      height: 'calc(100vh - 80px)', 
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <Content style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div className="animate-fade-in-up">
          {isLogin ? (
            <LoginForm 
              onSuccess={handleAuthSuccess} 
              onSwitchToRegister={switchToRegister}
            />
          ) : (
            <RegisterForm 
              onSuccess={handleAuthSuccess} 
              onSwitchToLogin={switchToLogin}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default AuthPage;
