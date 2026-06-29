import React, { useState, useEffect } from 'react';
import { Radio, Button, Typography, Space, Alert, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import type { SatQuestion, AnswerResponse } from '../types/sat';
import MathRenderer from './MathRenderer';
import { FavoriteQuestionService } from '../services/favoriteQuestionService';
import CorrectAnswerCelebration from './CorrectAnswerCelebration';
import { playCorrectAnswerChime, prepareFeedbackAudio } from '../utils/feedbackAudio';

const { Title, Text, Paragraph } = Typography;

interface SatQuestionCardProps {
  question: SatQuestion;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  onSubmitAnswer: () => void;
  answerResult: AnswerResponse | null;
  showAnswer?: boolean;
  celebrateOnCorrect?: boolean;
}

const SatQuestionCard: React.FC<SatQuestionCardProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  onSubmitAnswer,
  answerResult,
  showAnswer = false,
  celebrateOnCorrect = true,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [question.id]);

  useEffect(() => {
    if (!showAnswer || !answerResult?.isCorrect || !celebrateOnCorrect) return;

    setShowCelebration(true);
    playCorrectAnswerChime();
    const timeout = window.setTimeout(() => setShowCelebration(false), 1700);
    return () => window.clearTimeout(timeout);
  }, [answerResult, celebrateOnCorrect, showAnswer]);

  const checkFavoriteStatus = async () => {
    try {
      const favorited = await FavoriteQuestionService.checkFavoriteStatus(question.id);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    setLoading(true);
    try {
      if (isFavorited) {
        await FavoriteQuestionService.removeFavoriteQuestion(question.id);
        setIsFavorited(false);
        message.success('Removed from favorites.');
      } else {
        await FavoriteQuestionService.addFavoriteQuestion({
          questionId: question.id,
          questionData: JSON.stringify(question)
        });
        setIsFavorited(true);
        message.success('Added to favorites.');
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
      message.error('That action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { key: 'A', value: question.choiceA },
    { key: 'B', value: question.choiceB },
    { key: 'C', value: question.choiceC },
    { key: 'D', value: question.choiceD },
  ].filter(option => option.value); // 过滤掉空选项

  const getOptionStyle = (optionKey: string) => {
    if (!showAnswer || !answerResult) return {};

    const isSelected = selectedAnswer === optionKey;
    const isCorrect = answerResult.correctAnswer === optionKey;

    if (isCorrect) {
      return { backgroundColor: '#f6ffed', borderColor: '#52c41a' };
    } else if (isSelected && !isCorrect) {
      return { backgroundColor: '#fff2f0', borderColor: '#ff4d4f' };
    }
    return {};
  };

  const getOptionIcon = (optionKey: string) => {
    if (!showAnswer || !answerResult) return null;

    const isCorrect = answerResult.correctAnswer === optionKey;
    const isSelected = selectedAnswer === optionKey;

    if (isCorrect) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    } else if (isSelected && !isCorrect) {
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    return null;
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '600px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {showCelebration && <CorrectAnswerCelebration />}
      {/* 题目信息头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Button
          type="text"
          icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
          onClick={handleToggleFavorite}
          loading={loading}
          style={{
            color: isFavorited ? '#ff4d4f' : '#d9d9d9',
            fontSize: '20px',
            height: '40px',
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </div>

      {/* SVG内容 */}
      {question.visualsSvgContent &&
       question.visualsSvgContent !== 'null' &&
       question.visualsSvgContent.trim() !== '' && (
        <div
          style={{
            textAlign: 'center',
            margin: '24px 0',
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fafafa'
          }}
          dangerouslySetInnerHTML={{ __html: question.visualsSvgContent }}
        />
      )}

      {/* 题目段落 */}
      {question.questionParagraph &&
       question.questionParagraph !== 'null' &&
       question.questionParagraph.trim() !== '' && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <Paragraph style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
            <MathRenderer text={question.questionParagraph} />
          </Paragraph>
        </div>
      )}

      {/* 题目文本 */}
      {question.questionText &&
       question.questionText !== 'null' &&
       question.questionText.trim() !== '' && (
        <div style={{
          marginBottom: '32px',
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
            <MathRenderer text={question.questionText} />
          </Title>
        </div>
      )}

      {/* 选项区域 */}
      <div style={{ marginBottom: '32px' }}>
        <Text strong style={{
          marginBottom: '20px',
          display: 'block',
          fontSize: '16px',
          color: '#262626'
        }}>
          Choose the best answer:
        </Text>
        <Radio.Group
          value={selectedAnswer}
          onChange={(e) => onAnswerSelect(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {options.map((option) => (
              <Radio
                key={option.key}
                value={option.key}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  border: '2px solid #e8e8e8',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#fff',
                  transition: 'all 0.3s ease',
                  ...getOptionStyle(option.key),
                }}
              >
                <Space style={{ width: '100%' }}>
                  <Text strong style={{
                    fontSize: '16px',
                    color: selectedAnswer === option.key ? '#1890ff' : '#262626',
                    minWidth: '24px'
                  }}>
                    {option.key}.
                  </Text>
                  <div style={{ flex: 1 }}>
                    <MathRenderer text={option.value || ''} />
                  </div>
                  {getOptionIcon(option.key)}
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      {/* 提交按钮 */}
      {!showAnswer && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Button
            type="primary"
            size="large"
            onClick={() => {
              prepareFeedbackAudio();
              onSubmitAnswer();
            }}
            disabled={!selectedAnswer}
            style={{
              minWidth: '160px',
              height: '48px',
              fontSize: '16px',
              borderRadius: '8px'
            }}
          >
            Submit Answer
          </Button>
        </div>
      )}

      {/* 答案结果 */}
      {showAnswer && answerResult && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <Alert
            message={
              <Space>
                {answerResult.isCorrect ? (
                  <>
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                    <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>Correct answer!</Text>
                  </>
                ) : (
                  <>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
                    <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>Incorrect answer</Text>
                  </>
                )}
              </Space>
            }
            description={
              <div style={{ marginTop: '12px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{ fontSize: '14px' }}>Your answer: </Text>
                  <Text strong style={{ fontSize: '14px' }}>{answerResult.userAnswer}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: '14px' }}>Correct answer: </Text>
                  <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
                    {answerResult.correctAnswer}
                  </Text>
                </div>
              </div>
            }
            type={answerResult.isCorrect ? 'success' : 'error'}
            showIcon={false}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              padding: 0
            }}
          />

          {/* 题目解析 */}
          {answerResult.explanation &&
           answerResult.explanation !== 'null' &&
           answerResult.explanation.trim() !== '' && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #e8e8e8'
            }}>
              <Text strong style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '15px',
                color: '#262626'
              }}>
                Explanation
              </Text>
              <Paragraph style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                <MathRenderer text={answerResult.explanation} />
              </Paragraph>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SatQuestionCard;
