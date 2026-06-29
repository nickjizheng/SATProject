import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Empty, List, message, Progress, Row, Space, Spin, Statistic, Tag, Typography } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  HeartOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { DashboardService, type RecentActivity, type UserStats } from '../services/dashboardService';
import { getUserPreferences } from '../utils/userPreferences';

const { Title, Text } = Typography;

interface UserInfo {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
}

interface MetricCardProps {
  className: string;
  title: string;
  value: number;
  suffix?: string;
  prefix: ReactNode;
  detail: string;
  onClick: () => void;
}

function MetricCard({ className, title, value, suffix, prefix, detail, onClick }: MetricCardProps) {
  return (
    <Card
      className={`metric-card ${className}`}
      hoverable
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
      style={{ cursor: 'pointer', color: 'white', border: 'none' }}
    >
      <Statistic
        title={<span style={{ color: 'rgba(255,255,255,.75)' }}>{title}</span>}
        value={value}
        suffix={suffix}
        prefix={prefix}
        valueStyle={{ color: 'white', fontSize: '28px' }}
      />
      <Text style={{ color: 'rgba(255,255,255,.68)', fontSize: '12px' }}>{detail}</Text>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, activities] = await Promise.all([
        DashboardService.getUserStats(),
        DashboardService.getRecentActivities(8),
      ]);
      setUserStats(stats);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      message.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      navigate('/auth?mode=login');
      return;
    }

    try {
      setUserInfo(JSON.parse(user));
      void loadDashboardData();
    } catch {
      navigate('/auth?mode=login');
    }
  }, [navigate]);

  const formatTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
    return `${Math.floor(minutes / 1440)} day(s) ago`;
  };

  const activityIcon = (type: RecentActivity['type']) => {
    if (type === 'question_answered') return <CheckCircleOutlined style={{ color: '#2f855a' }} />;
    if (type === 'favorite_added') return <HeartOutlined style={{ color: '#e07a5f' }} />;
    if (type === 'word_searched') return <SearchOutlined style={{ color: '#123d3a' }} />;
    return <UserOutlined style={{ color: '#9a6923' }} />;
  };

  const scrollToPerformance = () => document.querySelector('#domain-performance')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const displayName = getUserPreferences().displayName || userInfo?.username || 'Student';

  if (!userInfo || loading) {
    return <div className="grid min-h-screen place-items-center"><Spin size="large" /></div>;
  }

  return (
    <div className="page-shell">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-kicker">Your learning record</p>
          <Title level={1} className="!mb-1 !mt-2">Welcome back, {displayName}.</Title>
          <Text type="secondary">Choose a snapshot below to jump straight to the work behind it.</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void loadDashboardData()}>Refresh</Button>
      </div>

      <Row gutter={[18, 18]} className="mb-6">
        <Col xs={24} sm={12} xl={6}>
          <MetricCard className="metric-teal" title="Questions Answered" value={userStats?.answeredQuestions || 0} prefix={<BookOutlined />} detail="Continue in SAT Practice" onClick={() => navigate('/sat-practice')} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard className="metric-coral" title="Accuracy" value={userStats?.averageScore || 0} suffix="%" prefix={<TrophyOutlined />} detail="View performance by domain" onClick={scrollToPerformance} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard className="metric-ochre" title="Study Streak" value={userStats?.studyStreak || 0} prefix={<FireOutlined />} detail="Keep it going with Daily Quick" onClick={() => navigate('/sat-single')} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricCard className="metric-ink" title="Saved Questions" value={userStats?.favoriteQuestions || 0} prefix={<StarOutlined />} detail="Open your review collection" onClick={() => navigate('/favorite-questions')} />
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={15}>
          <Card title="Choose your next move" className="mb-5">
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}><Button type="primary" block size="large" icon={<BookOutlined />} onClick={() => navigate('/sat-practice')}>SAT Practice</Button></Col>
              <Col xs={24} sm={12}><Button block size="large" icon={<FireOutlined />} onClick={() => navigate('/sat-single')}>Daily Quick</Button></Col>
              <Col xs={24} sm={12}><Button block size="large" icon={<SearchOutlined />} onClick={() => navigate('/dictionary')}>Dictionary</Button></Col>
              <Col xs={24} sm={12}><Button block size="large" icon={<HeartOutlined />} onClick={() => navigate('/favorite-words')}>Saved Words</Button></Col>
            </Row>
          </Card>

          <Card title="Recent activity">
            {recentActivities.length ? (
              <List
                dataSource={recentActivities}
                renderItem={activity => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={activityIcon(activity.type)}
                      title={<Text>{activity.description}</Text>}
                      description={<Tag>{formatTimeAgo(activity.timestamp)}</Tag>}
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="Your activity will appear here after your first study action." />}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card id="domain-performance" title="Performance by domain" className="mb-5 scroll-mt-8">
            {userStats?.domainStats.length ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {userStats.domainStats.map(domain => (
                  <div key={domain.domain}>
                    <div className="mb-1 flex justify-between gap-3">
                      <Text>{domain.domain}</Text>
                      <Text strong>{domain.averageScore.toFixed(1)}%</Text>
                    </div>
                    <Progress percent={domain.averageScore} showInfo={false} />
                    <Text type="secondary" style={{ fontSize: 11 }}>{domain.answeredQuestions} answered</Text>
                  </div>
                ))}
              </Space>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Answer a few questions to reveal domain patterns." />}
          </Card>

          <Card title="Your study snapshot">
            <Row gutter={[12, 18]}>
              <Col span={12}><Statistic title="Correct" value={userStats?.correctAnswers || 0} prefix={<CheckCircleOutlined />} /></Col>
              <Col span={12}><Statistic title="Saved words" value={userStats?.favoriteWords || 0} prefix={<HeartOutlined />} /></Col>
            </Row>
            <div className="mt-5 rounded-2xl bg-[#123d3a] p-5 text-white">
              <ClockCircleOutlined className="text-[#e6d8bb]" />
              <p className="mt-3 font-display text-2xl leading-tight">A short session still counts.</p>
              <p className="mt-2 text-xs leading-5 text-white/55">Daily Quick selects an unanswered question at random and shares the same history as full practice.</p>
              <Button className="mt-4" onClick={() => navigate('/sat-single')}>Answer one now</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
