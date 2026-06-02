import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Button, Space, Tag, message, Empty, Spin, Modal, Radio, Divider } from 'antd';
import { HeartFilled, DeleteOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { FavoriteQuestionService, type FavoriteQuestionResponse } from '../services/favoriteQuestionService';
import { SatService } from '../services/satService';
import MathRenderer from '../components/MathRenderer';
import { getDomainDisplayName } from '../utils/domainMapping';
import type { SatQuestion, AnswerResponse } from '../types/sat';

const { Title, Text, Paragraph } = Typography;

const FavoriteQuestionsPage: React.FC = () => {
  const [favoriteQuestions, setFavoriteQuestions] = useState<FavoriteQuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<SatQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFavoriteQuestions();
  }, []);

  const loadFavoriteQuestions = async () => {
    try {
      setLoading(true);
      const questions = await FavoriteQuestionService.getFavoriteQuestions();
      setFavoriteQuestions(questions);
    } catch (error) {
      console.error('加载收藏题目失败:', error);
      message.error('加载收藏题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    try {
      setDeletingIds(prev => new Set(prev).add(questionId));
      await FavoriteQuestionService.removeFavoriteQuestion(questionId);
      setFavoriteQuestions(prev => prev.filter(q => q.questionId !== questionId));
      message.success('已取消收藏');
    } catch (error) {
      console.error('删除收藏失败:', error);
      message.error('删除失败，请重试');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleViewQuestion = (questionData: string) => {
    try {
      const question = JSON.parse(questionData);
      setCurrentQuestion(question);
      setSelectedAnswer('');
      setShowAnswer(false);
      setViewModalVisible(true);
    } catch (error) {
      console.error('解析题目数据失败:', error);
      message.error('题目数据解析失败');
    }
  };

  const handleCloseModal = () => {
    setViewModalVisible(false);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setShowAnswer(false);
    setAnswerResult(null);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) {
      message.warning('请选择一个答案');
      return;
    }

    setSubmitting(true);
    try {
      // 生成临时会话ID
      const tempSessionId = 'favorite-session-' + Date.now();
      
      // 调用后端API提交答案
      const result = await SatService.submitAnswerWithRecord({
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        sessionId: tempSessionId,
      });
      
      setAnswerResult(result);
      setShowAnswer(true);
      
      message.success(result.isCorrect ? '回答正确！' : '回答错误，继续努力！');
    } catch (error) {
      console.error('提交答案失败:', error);
      message.error('提交答案失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (favoriteQuestions.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="还没有收藏任何题目"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <HeartFilled style={{ color: '#ff4d4f', marginRight: '8px' }} />
          我收藏的题目
        </Title>
        <Text type="secondary">共 {favoriteQuestions.length} 道题目</Text>
      </div>

      <List
        dataSource={favoriteQuestions}
        renderItem={(item) => (
          <List.Item>
            <Card
              style={{ width: '100%', marginBottom: '16px' }}
              actions={[
                <Button
                  key="view"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewQuestion(item.questionData)}
                >
                  查看题目
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deletingIds.has(item.questionId)}
                  onClick={() => handleDelete(item.questionId)}
                >
                  取消收藏
                </Button>
              ]}
            >
              <div style={{ marginBottom: '16px' }}>
                <Space wrap>
                  {item.domain && (
                    <Tag color="blue">{getDomainDisplayName(item.domain)}</Tag>
                  )}
                  {item.difficulty && (
                    <Tag color="orange">{item.difficulty}</Tag>
                  )}
                  <Tag color="green">题目ID: {item.questionId}</Tag>
                </Space>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text strong>题目内容：</Text>
                <div style={{ marginTop: '8px' }}>
                  <MathRenderer text={item.questionText || '题目内容解析失败'} />
                </div>
              </div>

              <div style={{ color: '#666', fontSize: '12px' }}>
                收藏时间：{new Date(item.createdAt).toLocaleString()}
              </div>
            </Card>
          </List.Item>
        )}
      />

      {/* 查看题目模态框 */}
      <Modal
        title="题目详情"
        open={viewModalVisible}
        onCancel={handleCloseModal}
        width={800}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            关闭
          </Button>,
          !showAnswer && (
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              loading={submitting}
            >
              提交答案
            </Button>
          )
        ]}
      >
        {currentQuestion && (
          <div>
            {/* 题目信息 */}
            <div style={{ marginBottom: '20px' }}>
              <Space wrap>
                {currentQuestion.domain && (
                  <Tag color="blue">{getDomainDisplayName(currentQuestion.domain)}</Tag>
                )}
                <Tag color="green">题目ID: {currentQuestion.id}</Tag>
              </Space>
            </div>

            {/* SVG内容 */}
            {currentQuestion.visualsSvgContent && 
             currentQuestion.visualsSvgContent !== 'null' && 
             currentQuestion.visualsSvgContent.trim() !== '' && (
              <div 
                style={{ 
                  textAlign: 'center', 
                  margin: '20px 0',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#fafafa'
                }}
                dangerouslySetInnerHTML={{ __html: currentQuestion.visualsSvgContent }}
              />
            )}

            {/* 题目段落 */}
            {currentQuestion.questionParagraph && 
             currentQuestion.questionParagraph !== 'null' && 
             currentQuestion.questionParagraph.trim() !== '' && (
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <Paragraph style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
                  <MathRenderer text={currentQuestion.questionParagraph} />
                </Paragraph>
              </div>
            )}

            {/* 题目文本 */}
            {currentQuestion.questionText && 
             currentQuestion.questionText !== 'null' && 
             currentQuestion.questionText.trim() !== '' && (
              <div style={{ 
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#fff',
                border: '1px solid #e8e8e8',
                borderRadius: '8px'
              }}>
                <Title level={4} style={{ 
                  margin: 0, 
                  fontSize: '18px',
                  lineHeight: '1.5',
                  color: '#262626'
                }}>
                  <MathRenderer text={currentQuestion.questionText} />
                </Title>
              </div>
            )}

            {/* 选项 */}
            <div style={{ marginBottom: '24px' }}>
              <Text strong style={{ 
                marginBottom: '16px', 
                display: 'block',
                fontSize: '16px'
              }}>
                请选择答案：
              </Text>
              <Radio.Group 
                value={selectedAnswer} 
                onChange={(e) => setSelectedAnswer(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {[
                    { key: 'A', value: currentQuestion.choiceA },
                    { key: 'B', value: currentQuestion.choiceB },
                    { key: 'C', value: currentQuestion.choiceC },
                    { key: 'D', value: currentQuestion.choiceD },
                  ].filter(option => option.value && option.value !== 'null').map(option => (
                    <Radio 
                      key={option.key} 
                      value={option.key}
                      style={{ 
                        display: 'block',
                        padding: '12px',
                        border: '1px solid #e8e8e8',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        backgroundColor: showAnswer && answerResult ? 
                          (option.key === answerResult.correctAnswer ? '#f6ffed' : 
                           selectedAnswer === option.key ? '#fff2f0' : '#fff') : '#fff'
                      }}
                    >
                      <Space>
                        <Text strong style={{ 
                          color: showAnswer && answerResult && option.key === answerResult.correctAnswer ? '#52c41a' : 
                                showAnswer && answerResult && selectedAnswer === option.key && option.key !== answerResult.correctAnswer ? '#ff4d4f' : '#262626'
                        }}>
                          {option.key}.
                        </Text>
                        <MathRenderer text={option.value || ''} />
                        {showAnswer && answerResult && option.key === answerResult.correctAnswer && (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        )}
                        {showAnswer && answerResult && selectedAnswer === option.key && option.key !== answerResult.correctAnswer && (
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        )}
                      </Space>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>

            {/* 答案结果 */}
            {showAnswer && answerResult && (
              <div style={{ 
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <Space>
                  {answerResult.isCorrect ? (
                    <>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                      <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>回答正确！</Text>
                    </>
                  ) : (
                    <>
                      <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
                      <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>回答错误</Text>
                    </>
                  )}
                </Space>
                <div style={{ marginTop: '12px' }}>
                  <Text style={{ fontSize: '14px' }}>您的答案: </Text>
                  <Text strong style={{ fontSize: '14px' }}>{answerResult.userAnswer}</Text>
                  <Divider type="vertical" />
                  <Text style={{ fontSize: '14px' }}>正确答案: </Text>
                  <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
                    {answerResult.correctAnswer}
                  </Text>
                </div>
                {answerResult.explanation && 
                 answerResult.explanation !== 'null' && 
                 answerResult.explanation.trim() !== '' && (
                  <div style={{ marginTop: '16px' }}>
                    <Text strong style={{ 
                      display: 'block', 
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#262626'
                    }}>
                      题目解析
                    </Text>
                    <Paragraph style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                      <MathRenderer text={answerResult.explanation} />
                    </Paragraph>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FavoriteQuestionsPage;

