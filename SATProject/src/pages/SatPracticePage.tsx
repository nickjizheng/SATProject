import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Spin, message, Typography, Space, Row, Col, Progress, Statistic, Tag } from 'antd';
import { ReloadOutlined, LeftOutlined, RightOutlined, TrophyOutlined } from '@ant-design/icons';
import type { SatQuestion, AnswerResponse } from '../types/sat';
import { SatService } from '../services/satService';
import SatQuestionCard from '../components/SatQuestionCard';
import { getDomainDisplayName } from '../utils/domainMapping';

const { Title, Text } = Typography;
const { Option } = Select;

const SatPracticePage: React.FC = () => {
  const [questions, setQuestions] = useState<SatQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [questionCount, setQuestionCount] = useState(10);
  const [practiceStats, setPracticeStats] = useState({
    correctAnswers: 0,
    totalAnswered: 0,
    startTime: Date.now()
  });

  // Load domain list
  useEffect(() => {
    loadDomains();
  }, []);

  // Load questions
  useEffect(() => {
    // Try to load questions regardless of domain data
    loadQuestions();
  }, [selectedDomain, questionCount]);

  const loadDomains = async () => {
    try {
      const domainsList = await SatService.getAllDomains();
      console.log('Retrieved domain list:', domainsList);
      setDomains(domainsList);
      if (domainsList.length === 0) {
        message.warning('No domain data found, please check the sat_questions table in the database');
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
      message.error('Failed to load domains: ' + (error as Error).message);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      let questionsList: SatQuestion[];
      if (selectedDomain) {
        console.log('Getting questions by domain:', selectedDomain, 'count:', questionCount);
        questionsList = await SatService.getQuestionsByDomain(selectedDomain, questionCount);
      } else {
        console.log('Getting random questions, count:', questionCount);
        questionsList = await SatService.getRandomQuestions(questionCount);
      }
      console.log('Retrieved question list:', questionsList);
      setQuestions(questionsList);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setAnswerResult(null);
      
      if (questionsList.length === 0) {
        message.warning('未找到任何题目数据，请检查数据库');
      }
    } catch (error) {
      console.error('加载题目失败:', error);
      message.error('加载题目失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setAnswerResult(null);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      message.warning('请选择一个答案');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      message.error('当前题目不存在');
      return;
    }

    try {
      // Generate temporary session ID for practice page
      const tempSessionId = 'temp-session-' + Date.now();
      const result = await SatService.submitAnswer({
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        sessionId: tempSessionId,
      });
      
      setAnswerResult(result);
      
      // 更新统计信息
      setPracticeStats(prev => ({
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        correctAnswers: result.isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers
      }));
      
      message.success(result.isCorrect ? '回答正确！' : '回答错误，继续努力！');
    } catch (error) {
      console.error('Submit answer error:', error);
      message.error('提交答案失败: ' + (error as Error).message);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setAnswerResult(null);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer('');
      setAnswerResult(null);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;
  const accuracyPercent = practiceStats.totalAnswered > 0 ? Math.round((practiceStats.correctAnswers / practiceStats.totalAnswered) * 100) : 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>SAT 练习模式</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            选择科目和题目数量开始练习
          </Text>
        </div>

        {/* 控制面板 */}
        <Card 
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>选择科目</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="全部科目"
                  value={selectedDomain}
                  onChange={setSelectedDomain}
                  allowClear
                >
                  {domains.map(domain => (
                    <Option key={domain} value={domain}>{getDomainDisplayName(domain)}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>题目数量</Text>
                <Select
                  style={{ width: '100%' }}
                  value={questionCount}
                  onChange={setQuestionCount}
                >
                  <Option value={5}>5 题</Option>
                  <Option value={10}>10 题</Option>
                  <Option value={20}>20 题</Option>
                  <Option value={50}>50 题</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={loadQuestions}
                loading={loading}
                size="large"
                style={{ width: '100%', marginTop: '28px', height: '32px', fontSize: '16px', borderRadius: '8px' }}
              >
                开始练习
              </Button>
            </Col>
            <Col xs={24} sm={24} md={6}>
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Statistic
                    title="正确率"
                    value={accuracyPercent}
                    suffix="%"
                    valueStyle={{ color: accuracyPercent >= 80 ? '#52c41a' : accuracyPercent >= 60 ? '#faad14' : '#ff4d4f' }}
                    prefix={<TrophyOutlined />}
                  />
                  <Statistic
                    title="已答题"
                    value={practiceStats.totalAnswered}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {loading ? (
          <Card style={{ textAlign: 'center', padding: '60px', borderRadius: '12px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', fontSize: '16px' }}>正在加载题目...</div>
          </Card>
        ) : questions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '60px', borderRadius: '12px' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>暂无题目数据，请检查数据库</Text>
          </Card>
        ) : currentQuestion ? (
          <>
            {/* 进度条和导航 */}
            <Card 
              style={{ 
                marginBottom: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Row align="middle" gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text strong style={{ fontSize: '18px' }}>
                      第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题
                    </Text>
                    <Progress 
                      percent={progressPercent} 
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Space>
                      <Button 
                        icon={<LeftOutlined />}
                        onClick={handlePrevQuestion} 
                        disabled={currentQuestionIndex === 0}
                        size="large"
                      >
                        上一题
                      </Button>
                      <Button 
                        icon={<RightOutlined />}
                        onClick={handleNextQuestion} 
                        disabled={currentQuestionIndex === questions.length - 1}
                        size="large"
                      >
                        下一题
                      </Button>
                    </Space>
                  </div>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="blue" style={{ fontSize: '14px', padding: '8px 16px' }}>
                      {getDomainDisplayName(currentQuestion.domain)}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 题目卡片 */}
            <Card 
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: '600px'
              }}
            >
              <SatQuestionCard
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={handleAnswerSelect}
                onSubmitAnswer={handleSubmitAnswer}
                answerResult={answerResult}
                showAnswer={!!answerResult}
              />
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SatPracticePage;
