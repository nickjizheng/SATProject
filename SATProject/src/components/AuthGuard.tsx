import React from 'react';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 认证守卫组件
 * 检查用户是否已登录，未登录则重定向到登录页面
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // 检查localStorage中是否有token
  const token = localStorage.getItem('token');
  
  if (!token) {
    // 没有token，重定向到登录页面
    return <Navigate to="/auth?mode=login" replace />;
  }
  
  // 有token，渲染子组件
  return <>{children}</>;
};

export default AuthGuard;
