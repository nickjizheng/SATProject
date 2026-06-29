import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Dropdown, Button } from 'antd';
import {
  LoginOutlined,
  UserAddOutlined,
  BookOutlined,
  LogoutOutlined,
  UserOutlined,
  SearchOutlined,
  HeartOutlined,
  StarOutlined,
  HomeOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface NavigationProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        setUserInfo(JSON.parse(userStr));
      } catch (error) {
        console.error('Failed to parse user information:', error);
        // 清除无效的用户信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [location.pathname]); // 当路由变化时重新检查登录状态

  const handleLogoClick = () => {
    if (isLoggedIn) {
      navigate('/home');
    } else {
      navigate('/auth?mode=login');
    }
  };

  const handleLoginClick = () => {
    navigate('/auth?mode=login');
  };

  const handleRegisterClick = () => {
    navigate('/auth?mode=register');
  };

  const handleSatPracticeClick = () => {
    navigate('/sat-practice');
  };

  const handleSatSingleClick = () => {
    navigate('/sat-single');
  };

  const handleDictionaryClick = () => {
    navigate('/dictionary');
  };

  const handleFavoriteWordsClick = () => {
    navigate('/favorite-words');
  };

  const handleFavoriteQuestionsClick = () => {
    navigate('/favorite-questions');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setUserInfo(null);
    navigate('/auth?mode=login');
  };

  // 在认证页面不显示导航
  if (location.pathname === '/auth') {
    return null;
  }

  // 菜单项配置
  const getMenuItems = () => {
    if (!isLoggedIn) {
      return [
        {
          key: '/auth?mode=login',
          icon: <LoginOutlined />,
          label: 'Log in',
          onClick: handleLoginClick
        },
        {
          key: '/auth?mode=register',
          icon: <UserAddOutlined />,
          label: 'Sign up',
          onClick: handleRegisterClick
        }
      ];
    }

    return [
      {
        key: '/home',
        icon: <HomeOutlined />,
        label: 'Home',
        onClick: () => navigate('/home')
      },
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/dashboard')
      },
      {
        key: '/sat-practice',
        icon: <BookOutlined />,
        label: 'SAT Practice',
        onClick: handleSatPracticeClick
      },
      {
        key: '/sat-single',
        icon: <BookOutlined />,
        label: 'Single Question',
        onClick: handleSatSingleClick
      },
      {
        key: '/dictionary',
        icon: <SearchOutlined />,
        label: 'Dictionary',
        onClick: handleDictionaryClick
      },
      {
        key: '/favorite-words',
        icon: <HeartOutlined />,
        label: 'Saved Words',
        onClick: handleFavoriteWordsClick
      },
      {
        key: '/favorite-questions',
        icon: <StarOutlined />,
        label: 'Saved Questions',
        onClick: handleFavoriteQuestionsClick
      }
    ];
  };

  // 用户菜单
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Log out
      </Menu.Item>
    </Menu>
  );

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        height: '100vh'
      }}
    >
      {/* Logo 区域 */}
      <div style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 16px'
      }}>
        {collapsed ? (
          <Title
            level={4}
            style={{
              margin: 0,
              color: '#1890ff',
              cursor: 'pointer'
            }}
            onClick={handleLogoClick}
          >
            SAT
          </Title>
        ) : (
          <Title
            level={3}
            style={{
              margin: 0,
              color: '#1890ff',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
            onClick={handleLogoClick}
          >
            SAT Project
          </Title>
        )}
      </div>

      {/* 用户信息区域 */}
      {isLoggedIn && (
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <Dropdown overlay={userMenu} placement="topCenter">
            <div style={{ cursor: 'pointer' }}>
              <Avatar
                size={collapsed ? 32 : 40}
                icon={<UserOutlined />}
                style={{
                  background: '#1890ff',
                  marginBottom: collapsed ? 0 : 8
                }}
              />
              {!collapsed && (
                <div>
                  <Text strong style={{ display: 'block', fontSize: '14px' }}>
                    {userInfo?.username || 'User'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {userInfo?.email}
                  </Text>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      )}

      {/* 导航菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        style={{
          border: 'none',
          background: 'transparent'
        }}
      />

      {/* 折叠按钮 */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        right: '16px'
      }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          style={{
            width: '100%',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </div>
    </Sider>
  );
};

export default Navigation;
