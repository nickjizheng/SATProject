import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {


  return (
    <div style={{ 
      height: '100vh', 
      width: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden'
    }}>
      {/* Hero Section */}
      <div style={{ 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1200px', width: '100%' }}>
          <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
            <Title 
              level={1} 
              className="animate-fade-in-up"
              style={{ 
                color: 'white', 
                fontSize: '4rem', 
                marginBottom: '24px',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                fontWeight: 700,
                letterSpacing: '-0.02em'
              }}
            >
              SAT Prep App
            </Title>
            <Paragraph 
              className="animate-fade-in-up"
              style={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontSize: '1.5rem', 
                marginBottom: '48px',
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: '600px',
                margin: '0 auto 48px auto'
              }}
            >
              Welcome to our SAT Prep App, your essential tool for mastering test questions and boosting your confidence for exam day!
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
