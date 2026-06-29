import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Avatar,
  Menu,
  Dropdown,
  message,
  Statistic,
  Progress,
  List,
  Tag,
  Spin,
  Empty,
  Divider
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BookOutlined,
  HeartOutlined,
  StarOutlined,
  SearchOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { DashboardService } from '../services/dashboardService';
import type { UserStats, RecentActivity } from '../services/dashboardService';

const { Title, Text } = Typography;

interface UserInfo {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查用户是否已登录
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      message.error('Please log in first.');
      navigate('/auth?mode=login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUserInfo(user);
      loadDashboardData();
    } catch (error) {
      message.error('Failed to read your user information.');
      navigate('/auth?mode=login');
    }
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, activities] = await Promise.all([
        DashboardService.getUserStats(),
        DashboardService.getRecentActivities(8)
      ]);

      setUserStats(stats);
      setRecentActivities(activities);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      message.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    message.success('You have been logged out.');
    navigate('/');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Log Out
      </Menu.Item>
    </Menu>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'question_answered':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'favorite_added':
        return <HeartOutlined style={{ color: '#ff4d4f' }} />;
      case 'word_searched':
        return <SearchOutlined style={{ color: '#1890ff' }} />;
      case 'login':
        return <UserOutlined style={{ color: '#722ed1' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
    return `${Math.floor(diffInMinutes / 1440)} day(s) ago`;
  };

  if (!userInfo || loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* 欢迎区域 */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Welcome back, {userInfo.username}!
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Keep going with your SAT prep journey.
          </Text>
        </div>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Button type="text" style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              size="large"
              icon={<UserOutlined />}
              style={{ marginRight: 8, background: '#1890ff' }}
            />
            <Space direction="vertical" size={0}>
              <Text strong>{userInfo.username}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {userInfo.emailVerified ? 'Verified' : 'Unverified'}
              </Text>
            </Space>
          </Button>
        </Dropdown>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card metric-teal"
            hoverable
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Questions Answered</span>}
              value={userStats?.answeredQuestions || 0}
              valueStyle={{ color: 'white', fontSize: '28px' }}
              prefix={<BookOutlined />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              Total of {userStats?.totalQuestions || 0} questions
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card metric-coral"
            hoverable
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Accuracy</span>}
              value={userStats?.averageScore || 0}
              suffix="%"
              valueStyle={{ color: 'white', fontSize: '28px' }}
              prefix={<TrophyOutlined />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              {userStats?.correctAnswers || 0} correct answers
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card metric-ochre"
            hoverable
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Study Streak</span>}
              value={userStats?.studyStreak || 0}
              valueStyle={{ color: 'white', fontSize: '28px' }}
              prefix={<FireOutlined />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              Consecutive study days
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card metric-ink"
            hoverable
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Favorites</span>}
              value={(userStats?.favoriteQuestions || 0) + (userStats?.favoriteWords || 0)}
              valueStyle={{ color: 'white', fontSize: '28px' }}
              prefix={<HeartOutlined />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              Questions {userStats?.favoriteQuestions || 0} + Words {userStats?.favoriteWords || 0}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Row gutter={[24, 24]}>
        {/* 左侧内容 */}
        <Col xs={24} lg={16}>
          {/* 快速操作 */}
          <Card
            title="Quick Actions"
            style={{ borderRadius: '16px', marginBottom: '24px' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<BookOutlined />}
                  onClick={() => navigate('/sat-practice')}
                  style={{ height: '60px', borderRadius: '12px' }}
                >
                  SAT Practice
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  size="large"
                  block
                  icon={<SearchOutlined />}
                  onClick={() => navigate('/dictionary')}
                  style={{ height: '60px', borderRadius: '12px' }}
                >
                  Dictionary
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  size="large"
                  block
                  icon={<StarOutlined />}
                  onClick={() => navigate('/favorite-questions')}
                  style={{ height: '60px', borderRadius: '12px' }}
                >
                  Favorite Questions
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 最近活动 */}
          <Card
            title="Recent Activity"
            style={{ borderRadius: '16px' }}
            extra={<Button type="link" icon={<RightOutlined />}>View all</Button>}
            bodyStyle={{ padding: '20px' }}
          >
            {recentActivities.length > 0 ? (
              <List
                dataSource={recentActivities}
                renderItem={(activity) => (
                  <List.Item style={{ padding: '12px 0', border: 'none' }}>
                    <List.Item.Meta
                      avatar={getActivityIcon(activity.type)}
                      title={
                        <Space>
                          <Text>{activity.description}</Text>
                          <Tag color="blue" style={{ fontSize: '11px' }}>
                            {formatTimeAgo(activity.timestamp)}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No recent activity yet" />
            )}
          </Card>
        </Col>

        {/* 右侧内容 */}
        <Col xs={24} lg={8}>
          {/* 学习进度 */}
          <Card
            title="Study Progress"
            style={{ borderRadius: '16px', marginBottom: '24px' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Overall Progress</Text>
                <Progress
                  percent={userStats ? Math.round((userStats.answeredQuestions / userStats.totalQuestions) * 100) : 0}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {userStats?.answeredQuestions || 0} / {userStats?.totalQuestions || 0} questions
                </Text>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              <div>
                <Text strong>Performance by Domain</Text>
                <div style={{ marginTop: 12 }}>
                  {userStats?.domainStats.map((domain, index) => (
                    <div key={index} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: '13px' }}>{domain.domain}</Text>
                        <Text style={{ fontSize: '13px', fontWeight: 500 }}>
                          {domain.averageScore.toFixed(1)}%
                        </Text>
                      </div>
                      <Progress
                        percent={domain.averageScore}
                        size="small"
                        strokeColor={index === 0 ? '#52c41a' : index === 1 ? '#1890ff' : '#fa8c16'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Space>
          </Card>

          {/* 用户信息 */}
          <Card
            title="Account Info"
            style={{ borderRadius: '16px' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Username</Text>
                <Text>{userInfo.username}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Email</Text>
                <Text style={{ fontSize: '12px' }}>{userInfo.email}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Status</Text>
                <Tag color={userInfo.emailVerified ? 'green' : 'orange'}>
                  {userInfo.emailVerified ? 'Verified' : 'Unverified'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>User ID</Text>
                <Text style={{ fontSize: '12px' }}>#{userInfo.id}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
