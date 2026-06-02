import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Spin, message, Typography, Space, Progress, Alert, Row, Col, Statistic } from 'antd';
import { ReloadOutlined, RightOutlined, TrophyOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { SatQuestion, AnswerResponse, NextQuestionResponse } from '../types/sat';
import { SatService } from '../services/satService';
import SatQuestionCard from '../components/SatQuestionCard';
import { getDomainOptions } from '../utils/domainMapping';

const { Title, Text } = Typography;
const { Option } = Select;

const SatSingleQuestionPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<SatQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [questionStats, setQuestionStats] = useState({
    answeredCount: 0,
    totalCount: 0,
    hasMoreQuestions: true
  });
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correctAnswers: 0,
    totalAnswered: 0,
    startTime: Date.now()
  });

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

  // Reload questions when domain changes
  useEffect(() => {
    if (sessionId) {
      loadNextQuestion();
    }
  }, [sessionId, selectedDomain]);

  const initializeSession = async () => {
    try {
      const newSessionId = await SatService.generateSession();
      setSessionId(newSessionId);
      console.log('创建新会话:', newSessionId);
    } catch (error) {
      console.error('创建会话失败:', error);
      message.error('创建会话失败');
    }
  };

  const loadNextQuestion = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setSelectedAnswer('');
    setAnswerResult(null);
    setShowAnswer(false);
    
    try {
      const response: NextQuestionResponse = await SatService.getNextQuestion({
        sessionId,
        domain: selectedDomain || undefined
      });
      
      console.log('Get next question response:', response);
      
      if (response.question) {
        setCurrentQuestion(response.question);
        setQuestionStats({
          answeredCount: response.answeredCount,
          totalCount: response.totalCount,
          hasMoreQuestions: response.hasMoreQuestions
        });
      } else {
        setCurrentQuestion(null);
        setQuestionStats({
          answeredCount: response.answeredCount,
          totalCount: response.totalCount,
          hasMoreQuestions: false
        });
        message.info('恭喜！您已经完成了所有题目');
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
    setShowAnswer(false);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) {
      message.warning('请选择一个答案');
      return;
    }

    try {
      const result = await SatService.submitAnswerWithRecord({
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        sessionId: sessionId
      });
      
      setAnswerResult(result);
      setShowAnswer(true);
      
      // 更新统计信息
      setQuestionStats(prev => ({
        ...prev,
        answeredCount: prev.answeredCount + 1
      }));

      setSessionStats(prev => ({
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        correctAnswers: result.isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers
      }));
      
      message.success(result.isCorrect ? '回答正确！' : '回答错误，继续努力！');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      message.error('提交答案失败: ' + (error as Error).message);
    }
  };

  const handleNextQuestion = () => {
    if (questionStats.hasMoreQuestions) {
      loadNextQuestion();
    } else {
      message.info('No more questions available');
    }
  };

  const handleRestart = () => {
    setSessionStats({
      correctAnswers: 0,
      totalAnswered: 0,
      startTime: Date.now()
    });
    initializeSession();
  };

  const progressPercent = questionStats.totalCount > 0 
    ? Math.round((questionStats.answeredCount / questionStats.totalCount) * 100)
    : 0;

  const accuracyPercent = sessionStats.totalAnswered > 0 
    ? Math.round((sessionStats.correctAnswers / sessionStats.totalAnswered) * 100)
    : 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>SAT 单题模式</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            逐题练习，记录学习进度
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
            <Col xs={24} sm={12} md={8}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>选择科目</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="全部科目"
                  value={selectedDomain}
                  onChange={setSelectedDomain}
                  allowClear
                >
                  {getDomainOptions().map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={handleRestart}
                size="large"
                style={{ width: '100%', marginTop: '28px', height: '32px', fontSize: '16px', borderRadius: '8px' }}
              >
                重新开始
              </Button>
            </Col>
            <Col xs={24} sm={24} md={8}>
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
                    value={sessionStats.totalAnswered}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 进度显示 */}
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
                  已答题 {questionStats.answeredCount} / 总计 {questionStats.totalCount}
                </Text>
                <Progress 
                  percent={progressPercent} 
                  status={questionStats.hasMoreQuestions ? 'active' : 'success'}
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
                  <Statistic
                    title="正确题数"
                    value={sessionStats.correctAnswers}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                  <Statistic
                    title="错误题数"
                    value={sessionStats.totalAnswered - sessionStats.correctAnswers}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Space>
              </div>
            </Col>
            <Col xs={24} sm={24} md={8}>
              {!questionStats.hasMoreQuestions && (
                <Alert
                  message="恭喜完成！"
                  description="您已完成所有题目，可以重新开始或选择其他科目。"
                  type="success"
                  showIcon
                />
              )}
            </Col>
          </Row>
        </Card>

        {/* 题目区域 */}
        {loading ? (
          <Card style={{ textAlign: 'center', padding: '60px', borderRadius: '12px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', fontSize: '16px' }}>正在加载题目...</div>
          </Card>
        ) : currentQuestion ? (
          <>
            <Card 
              style={{ 
                marginBottom: '24px',
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
                showAnswer={showAnswer}
              />
            </Card>

            {/* 下一题按钮 */}
            {showAnswer && questionStats.hasMoreQuestions && (
              <Card 
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<RightOutlined />}
                    onClick={handleNextQuestion}
                    style={{ minWidth: '160px', height: '48px', fontSize: '16px' }}
                  >
                    下一题
                  </Button>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card style={{ textAlign: 'center', padding: '60px', borderRadius: '12px' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>暂无题目数据</Text>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SatSingleQuestionPage;
