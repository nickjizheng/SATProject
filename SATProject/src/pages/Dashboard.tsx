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
      message.error('请先登录');
      navigate('/auth?mode=login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUserInfo(user);
      loadDashboardData();
    } catch (error) {
      message.error('用户信息解析失败');
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
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人资料
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
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
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return `${Math.floor(diffInMinutes / 1440)}天前`;
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
            欢迎回来，{userInfo.username}！
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            继续您的SAT学习之旅
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
                {userInfo.emailVerified ? '已验证' : '未验证'}
              </Text>
            </Space>
          </Button>
        </Dropdown>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>已答题数</span>}
              value={userStats?.answeredQuestions || 0}
              valueStyle={{ color: 'white', fontSize: '28px' }}
              prefix={<BookOutlined />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              共 {userStats?.totalQuestions || 0} 道题目
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>正确率</span>}
              value={userStats?.averageScore || 0}
              suffix="%"
              valueStyle={{ color: 'white', fontSize: '28px' }}
              prefix={<TrophyOutlined />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              正确 {userStats?.correctAnswers || 0} 题
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>学习天数</span>}
              value={userStats?.studyStreak || 0}
              valueStyle={{ color: 'white', fontSize: '28px' }}
              prefix={<FireOutlined />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              连续学习记录
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>收藏数量</span>}
              value={(userStats?.favoriteQuestions || 0) + (userStats?.favoriteWords || 0)}
              valueStyle={{ color: 'white', fontSize: '28px' }}
              prefix={<HeartOutlined />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              题目 {userStats?.favoriteQuestions || 0} + 单词 {userStats?.favoriteWords || 0}
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
            title="快速操作" 
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
                  SAT 练习
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
                  词典查询
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
                  收藏题目
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 最近活动 */}
          <Card 
            title="最近活动" 
            style={{ borderRadius: '16px' }}
            extra={<Button type="link" icon={<RightOutlined />}>查看全部</Button>}
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
              <Empty description="暂无最近活动" />
            )}
          </Card>
        </Col>

        {/* 右侧内容 */}
        <Col xs={24} lg={8}>
          {/* 学习进度 */}
          <Card 
            title="学习进度" 
            style={{ borderRadius: '16px', marginBottom: '24px' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>总体进度</Text>
                <Progress 
                  percent={userStats ? Math.round((userStats.answeredQuestions / userStats.totalQuestions) * 100) : 0}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {userStats?.answeredQuestions || 0} / {userStats?.totalQuestions || 0} 题目
                </Text>
              </div>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <div>
                <Text strong>各科目表现</Text>
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
            title="账户信息" 
            style={{ borderRadius: '16px' }}
            bodyStyle={{ padding: '20px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>用户名</Text>
                <Text>{userInfo.username}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>邮箱</Text>
                <Text style={{ fontSize: '12px' }}>{userInfo.email}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>验证状态</Text>
                <Tag color={userInfo.emailVerified ? 'green' : 'orange'}>
                  {userInfo.emailVerified ? '已验证' : '未验证'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>用户ID</Text>
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
