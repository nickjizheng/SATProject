import React, { useState, useEffect } from 'react';
import { Alert, Card, Button, Select, Spin, message, Typography, Space, Row, Col, Progress, Statistic, Tag } from 'antd';
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
  const [sessionId] = useState(() => `practice-session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [restoringAnswer, setRestoringAnswer] = useState(false);
  const [restoredFromHistory, setRestoredFromHistory] = useState(false);
  const [answerSummary, setAnswerSummary] = useState({
    answeredQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
  });

  // Load domain list
  useEffect(() => {
    loadDomains();
    loadAnswerSummary();
  }, []);

  // Load questions
  useEffect(() => {
    // Try to load questions regardless of domain data
    loadQuestions();
  }, [selectedDomain, questionCount]);

  const loadAnswerSummary = async () => {
    try {
      const summary = await SatService.getAnswerSummary();
      setAnswerSummary(summary);
    } catch (error) {
      console.error('Failed to load SAT answer summary:', error);
    }
  };

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
      setRestoredFromHistory(false);

      if (questionsList.length === 0) {
        message.warning('No questions with verified answer keys are available for this selection.');
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      message.error('Failed to load questions: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setAnswerResult(null);
    setRestoredFromHistory(false);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      message.warning('Please choose an answer.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      message.error('The current question is unavailable.');
      return;
    }

    try {
      const result = await SatService.submitAnswerWithRecord({
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        sessionId,
      });

      setAnswerResult(result);
      setRestoredFromHistory(false);
      await loadAnswerSummary();

      message.success(result.isCorrect ? 'Correct answer!' : 'Incorrect answer. Keep going.');
    } catch (error) {
      console.error('Submit answer error:', error);
      message.error('Failed to submit your answer: ' + (error as Error).message);
    }
  };

  const navigateToQuestion = async (index: number) => {
    const targetQuestion = questions[index];
    setCurrentQuestionIndex(index);
    setSelectedAnswer('');
    setAnswerResult(null);
    setRestoredFromHistory(false);
    setRestoringAnswer(true);

    try {
      const recordedAnswer = await SatService.getRecordedAnswer(targetQuestion.id, sessionId);
      if (recordedAnswer) {
        setSelectedAnswer(recordedAnswer.userAnswer);
        setAnswerResult(recordedAnswer);
        setRestoredFromHistory(true);
      }
    } catch (error) {
      console.error('Failed to restore the saved attempt:', error);
      message.error('Failed to restore the saved attempt.');
    } finally {
      setRestoringAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      void navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      void navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="practice-page" style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>SAT Practice Mode</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Build a focused set. Questions already answered on your account stay out of new sets.
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
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Domain</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="All domains"
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
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Question Count</Text>
                <Select
                  style={{ width: '100%' }}
                  value={questionCount}
                  onChange={setQuestionCount}
                >
                  <Option value={5}>5 questions</Option>
                  <Option value={10}>10 questions</Option>
                  <Option value={20}>20 questions</Option>
                  <Option value={50}>50 questions</Option>
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
                className="practice-start-button"
                style={{ width: '100%', marginTop: '28px', height: '48px', fontSize: '16px', borderRadius: '8px' }}
              >
                Start Practice
              </Button>
            </Col>
            <Col xs={24} sm={24} md={6}>
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

        {loading ? (
          <Card style={{ textAlign: 'center', padding: '60px', borderRadius: '12px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', fontSize: '16px' }}>Loading questions...</div>
          </Card>
        ) : questions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '60px', borderRadius: '12px' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>No questions with verified answer keys are available yet.</Text>
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
                      Question {currentQuestionIndex + 1} of {questions.length}
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
                    <Space wrap className="question-navigation-actions">
                      <Button
                        icon={<LeftOutlined />}
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                        loading={restoringAnswer}
                        size="large"
                      >
                        Previous
                      </Button>
                      <Button
                        icon={<RightOutlined />}
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIndex === questions.length - 1}
                        loading={restoringAnswer}
                        size="large"
                      >
                        Next
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

            {restoredFromHistory && (
              <Alert
                message="Saved attempt restored from your account"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

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
                celebrateOnCorrect={!restoredFromHistory}
              />
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SatPracticePage;
