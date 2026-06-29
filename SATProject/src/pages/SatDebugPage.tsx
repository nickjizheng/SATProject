import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert } from 'antd';
import { SatService } from '../services/satService';
import type { SatQuestion } from '../types/sat';
import { getDomainDisplayName } from '../utils/domainMapping';
import MathRenderer from '../components/MathRenderer';

const { Title, Text } = Typography;

const SatDebugPage: React.FC = () => {
  const [domains, setDomains] = useState<string[]>([]);
  const [questions, setQuestions] = useState<SatQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testGetDomains = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Starting to get domains...');
      const domainsList = await SatService.getAllDomains();
      console.log('Retrieved domains:', domainsList);
      setDomains(domainsList);
    } catch (err) {
      console.error('Failed to get domains:', err);
      setError('Failed to get domains: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testGetQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Starting to fetch questions...');
      const questionsList = await SatService.getRandomQuestions(5);
      console.log('Fetched questions:', questionsList);
      setQuestions(questionsList);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError('Failed to fetch questions: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testGetQuestionsByDomain = async (domain: string) => {
    setLoading(true);
    setError('');
    try {
      console.log('Starting to get questions by domain:', domain);
      const questionsList = await SatService.getQuestionsByDomain(domain, 3);
      console.log('Retrieved questions:', questionsList);
      setQuestions(questionsList);
    } catch (err) {
      console.error('Failed to get questions by domain:', err);
      setError('Failed to get questions by domain: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>SAT API Debug Page</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 测试按钮 */}
        <Card title="API Tests">
          <Space wrap>
            <Button
              type="primary"
              onClick={testGetDomains}
              loading={loading}
            >
              Test Get Domains
            </Button>
            <Button
              onClick={testGetQuestions}
              loading={loading}
            >
              Test Random Questions
            </Button>
          </Space>
        </Card>

        {/* 错误信息 */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
          />
        )}

        {/* Domain List */}
        <Card title="Domain List">
          {domains.length > 0 ? (
            <Space wrap>
              {domains.map(domain => (
                <Button
                  key={domain}
                  onClick={() => testGetQuestionsByDomain(domain)}
                  loading={loading}
                >
                  {domain}
                </Button>
              ))}
            </Space>
          ) : (
            <Text type="secondary">No domain data available</Text>
          )}
        </Card>

        {/* Question List */}
        <Card title="Question List">
          {questions.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {questions.map((question, index) => (
                <Card key={question.id} size="small" title={`Question ${index + 1} (ID: ${question.id})`}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Domain: </Text>
                      <Text>{question.domain ? getDomainDisplayName(question.domain) : 'Not set'}</Text>
                    </div>
                    <div>
                      <Text strong>Question: </Text>
                      <MathRenderer text={question.questionText || 'No question text'} />
                    </div>
                    <div>
                      <Text strong>Choice A: </Text>
                      <MathRenderer text={question.choiceA || 'None'} />
                    </div>
                    <div>
                      <Text strong>Choice B: </Text>
                      <MathRenderer text={question.choiceB || 'None'} />
                    </div>
                    <div>
                      <Text strong>Choice C: </Text>
                      <MathRenderer text={question.choiceC || 'None'} />
                    </div>
                    <div>
                      <Text strong>Choice D: </Text>
                      <MathRenderer text={question.choiceD || 'None'} />
                    </div>
                  </Space>
                </Card>
              ))}
            </Space>
          ) : (
            <Text type="secondary">No question data available</Text>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default SatDebugPage;
