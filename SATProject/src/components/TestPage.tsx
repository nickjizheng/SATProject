import React, { useState } from 'react';
import { Button, Card, Typography, Space, message, Divider } from 'antd';
import { authService } from '../services/authService';
import MathRenderer from './MathRenderer';

const { Title, Text } = Typography;

const TestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // 测试数学公式
  const testMathFormulas = [
    "For what value of \\(k\\) does the equation \\(x^2+6x+k=0\\) have exactly one solution?",
    "If $x^2 - 6x + 9 = 0$, what is the value of $x$?",
    "The quadratic formula is: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$",
    "Solve for \\(x\\): \\(2x + 3 = 7\\)",
    "The area of a circle is \\(A = \\pi r^2\\)",
    "The function *f* is defined by *f*(x) = *x*2 + 3. What is the value of *f*(-2)?",
    "If *a* = 5 and *b* = 3, what is the value of *a* + *b*?",
    "The equation *y* = *mx* + *b* represents a linear function.",
    "The function \\(f(x)\\) is defined by \\(f(x) = 2x^2 - 3x + 1\\). What is the value of \\(f(-2)\\)?",
    "If \\(g(x) = x^3 + 2x^2 - x + 5\\), find \\(g(1)\\).",
    "The derivative of \\(f(x) = x^2\\) is \\(f'(x) = 2x\\)."
  ];

  const testSendCode = async () => {
    setLoading(true);
    try {
      const response = await authService.sendVerificationCode({ email: 'test@example.com' });
      setResult(JSON.stringify(response, null, 2));
      message.success('测试成功！');
    } catch (error: any) {
      setResult(JSON.stringify(error, null, 2));
      message.error('测试失败');
    } finally {
      setLoading(false);
    }
  };

  const testSubmitAnswer = async () => {
    setLoading(true);
    try {
      const { SatService } = await import('../services/satService');
      const response = await SatService.submitAnswer({
        questionId: 1,
        answer: 'A',
        sessionId: 'test-session-' + Date.now()
      });
      setResult(JSON.stringify(response, null, 2));
      message.success('提交答案测试成功！');
    } catch (error: any) {
      setResult(JSON.stringify(error, null, 2));
      message.error('提交答案测试失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: 'calc(100vh - 80px)', 
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px'
    }}>
      <Card style={{ 
        width: 600, 
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} className="gradient-text">
              API 测试页面
            </Title>
            <Text type="secondary">
              测试前后端跨域集成
            </Text>
          </div>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              size="large"
              loading={loading}
              onClick={testSendCode}
              block
              style={{
                height: '48px',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              测试发送验证码API
            </Button>
            
            <Button 
              type="default" 
              size="large"
              loading={loading}
              onClick={testSubmitAnswer}
              block
              style={{
                height: '48px',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              测试提交答案API
            </Button>
          </Space>

          {result && (
            <Card 
              size="small" 
              style={{ 
                background: '#f8f9fa',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '300px',
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {result}
              </pre>
            </Card>
          )}

          <Divider>数学公式测试</Divider>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Text strong>测试各种LaTeX格式的数学公式渲染</Text>
          </div>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {testMathFormulas.map((formula, index) => (
              <Card 
                key={index}
                size="small" 
                style={{ 
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8'
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    原始文本:
                  </Text>
                </div>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  marginBottom: '12px'
                }}>
                  {formula}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    渲染结果:
                  </Text>
                </div>
                <div style={{ 
                  background: '#fafafa', 
                  padding: '12px', 
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8'
                }}>
                  <MathRenderer text={formula} />
                </div>
              </Card>
            ))}
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default TestPage;
