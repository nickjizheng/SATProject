import React, { useState, useEffect } from 'react';
import { Card, Button, Spin, message, Typography, Space, Alert, Row, Col, Statistic, Tag } from 'antd';
import { ReloadOutlined, RightOutlined, TrophyOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { SatQuestion, AnswerResponse, NextQuestionResponse } from '../types/sat';
import { SatService } from '../services/satService';
import SatQuestionCard from '../components/SatQuestionCard';

const { Title, Text } = Typography;
const QUICK_SESSION_TARGET = 5;

const SatSingleQuestionPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<SatQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [questionStats, setQuestionStats] = useState({
    answeredCount: 0,
    hasMoreQuestions: true
  });
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [answerSummary, setAnswerSummary] = useState({
    answeredQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
  });

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId]);

  // Load a random unanswered question when the session is ready.
  useEffect(() => {
    if (sessionId) {
      loadNextQuestion();
    }
  }, [sessionId]);

  useEffect(() => {
    loadAnswerSummary();
  }, []);

  const loadAnswerSummary = async () => {
    try {
      const summary = await SatService.getAnswerSummary();
      setAnswerSummary(summary);
    } catch (error) {
      console.error('Failed to load SAT answer summary:', error);
    }
  };

  const initializeSession = async () => {
    try {
      const newSessionId = await SatService.generateSession();
      setSessionId(newSessionId);
      console.log('Created new session:', newSessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
      message.error('Failed to create a session.');
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
        sessionId
      });

      console.log('Get next question response:', response);

      if (response.question) {
        setCurrentQuestion(response.question);
        setQuestionStats({
          answeredCount: response.answeredCount,
          hasMoreQuestions: response.hasMoreQuestions
        });
      } else {
        setCurrentQuestion(null);
        setQuestionStats({
          answeredCount: response.answeredCount,
          hasMoreQuestions: false
        });
        message.info('No more questions with verified answer keys are available.');
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      message.error('Failed to load the next question: ' + (error as Error).message);
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
      message.warning('Please choose an answer.');
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
      setQuestionStats(prev => ({
        ...prev,
        answeredCount: prev.answeredCount + 1
      }));
      setSessionAnswered(previous => previous + 1);
      await loadAnswerSummary();

      message.success(result.isCorrect ? 'Correct answer!' : 'Incorrect answer. Keep going.');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      message.error('Failed to submit your answer: ' + (error as Error).message);
    }
  };

  const handleNextQuestion = () => {
    if (questionStats.hasMoreQuestions) {
      loadNextQuestion();
    } else {
      message.info('No more questions available');
    }
  };

  return (
    <div className="practice-page single-question-page" style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>Daily Quick Practice</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Jump into one random unanswered question from the full SAT bank.
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
            <Col xs={24} md={10}>
              <div style={{ paddingTop: '6px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Your mixed daily queue</Text>
                <Space wrap>
                  <Tag color="cyan">All domains</Tag>
                  <Tag color="green">Unanswered only</Tag>
                  <Tag color="gold">Random order</Tag>
                </Space>
              </div>
            </Col>
            <Col xs={24} sm={10} md={6}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={loadNextQuestion}
                loading={loading}
                size="large"
                className="practice-start-button"
                style={{ width: '100%', marginTop: '28px', height: '48px', fontSize: '16px', borderRadius: '8px' }}
              >
                Shuffle Question
              </Button>
            </Col>
            <Col xs={24} sm={14} md={8}>
              <div className="practice-stats" style={{ textAlign: 'right' }}>
                <Space wrap>
                  <Statistic
                    title="Accuracy"
                    value={answerSummary.accuracy}
                    suffix="%"
                    valueStyle={{ color: answerSummary.accuracy >= 80 ? '#52c41a' : answerSummary.accuracy >= 60 ? '#faad14' : '#ff4d4f' }}
                    prefix={<TrophyOutlined />}
                  />
                  <Statistic
                    title="Answered"
                    value={answerSummary.answeredQuestions}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Personal result summary. The question-bank size remains private. */}
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
                  {sessionAnswered} answered this quick session
                </Text>
                <div className="mx-auto mt-3 h-2 max-w-[220px] overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-[#123d3a] transition-[width] duration-500"
                    style={{ width: `${Math.min((sessionAnswered / QUICK_SESSION_TARGET) * 100, 100)}%` }}
                  />
                </div>
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  {sessionAnswered >= QUICK_SESSION_TARGET
                    ? 'Mini-session complete. Keep going if you have momentum.'
                    : 'Five questions makes a focused mini-session.'}
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div style={{ textAlign: 'center' }}>
                <Space>
                  <Statistic
                    title="Correct"
                    value={answerSummary.correctAnswers}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                  <Statistic
                    title="Incorrect"
                    value={Math.max(answerSummary.answeredQuestions - answerSummary.correctAnswers, 0)}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Space>
              </div>
            </Col>
            <Col xs={24} sm={24} md={8}>
              {!questionStats.hasMoreQuestions && (
                <Alert
                  message="All done!"
                  description="You have completed every available question in the mixed queue."
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
            <div style={{ marginTop: '16px', fontSize: '16px' }}>Loading question...</div>
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
                    Next Question
                  </Button>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card style={{ textAlign: 'center', padding: '60px', borderRadius: '12px' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>No question data available.</Text>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SatSingleQuestionPage;
