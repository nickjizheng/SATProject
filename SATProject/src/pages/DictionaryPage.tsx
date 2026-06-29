import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, Space, message, Spin, Alert, Tag } from 'antd';
import { SearchOutlined, BookOutlined, HeartOutlined, HistoryOutlined } from '@ant-design/icons';
import { DictionaryService } from '../services/dictionaryService';
import DictionaryResult from '../components/DictionaryResult';
import ErrorBoundary from '../components/ErrorBoundary';
import type { DictionaryResponse } from '../types/dictionary';

const { Title, Text } = Typography;
const { Search } = Input;
const RECENT_SEARCHES_KEY = 'satBuddyRecentDictionarySearches';

const DictionaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchWord, setSearchWord] = useState('');
  const [results, setResults] = useState<DictionaryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecentSearches(JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const rememberSearch = (word: string) => {
    const updated = [word, ...recentSearches.filter(item => item.toLowerCase() !== word.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearch = async (word: string) => {
    const normalizedWord = word.trim();

    if (!normalizedWord) {
      message.warning('Please enter a word to search');
      return;
    }

    if (normalizedWord.length > 225) {
      message.error('Search terms cannot exceed 225 characters.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await DictionaryService.getWordDefinition(normalizedWord);
      setResults(data);

      if (data.length === 0) {
        message.info('No definition found for this word');
      } else {
        rememberSearch(normalizedWord);
        message.success(`Found definition for "${word}"`);
      }
    } catch (error) {
      console.error('Search failed:', error);
      message.error('Failed to search word definition. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchWord(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchWord);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', marginTop: '120px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={1} style={{ color: '#1890ff', marginBottom: '8px' }}>
          <BookOutlined style={{ marginRight: '12px' }} />
          Dictionary
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Look up word definitions using Merriam-Webster Dictionary API
        </Text>
      </div>

      {/* Search Section */}
      <Card style={{
        marginBottom: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #f6f9ff 0%, #e6f7ff 100%)'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Search
              placeholder="Enter a word to look up..."
              value={searchWord}
              maxLength={225}
              onChange={handleInputChange}
              onSearch={handleSearch}
              onKeyPress={handleKeyPress}
              enterButton={
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={loading}
                  disabled={!searchWord.trim() || loading}
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}
                >
                  Search
                </Button>
              }
              size="large"
              style={{
                maxWidth: '600px',
                width: '100%',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            {recentSearches.length > 0 ? (
              <Space wrap style={{ justifyContent: 'center' }}>
                <Text type="secondary"><HistoryOutlined /> Recent:</Text>
                {recentSearches.map(word => (
                  <Tag.CheckableTag
                    key={word}
                    checked={false}
                    onChange={() => {
                      setSearchWord(word);
                      void handleSearch(word);
                    }}
                  >
                    {word}
                  </Tag.CheckableTag>
                ))}
              </Space>
            ) : (
              <Space wrap style={{ justifyContent: 'center' }}>
                <Text type="secondary">Search words you meet in practice, then save the useful ones for review.</Text>
                <Button type="link" icon={<HeartOutlined />} onClick={() => navigate('/favorite-words')}>Open saved words</Button>
              </Space>
            )}
          </div>
        </Space>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Searching for word definition...</Text>
          </div>
        </Card>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div>
          {results.length > 0 ? (
            <ErrorBoundary>
              <DictionaryResult data={results} />
            </ErrorBoundary>
          ) : (
            <Card>
              <Alert
                message="No Results Found"
                description="We couldn't find any definitions for this word. Please check the spelling and try again."
                type="warning"
                showIcon
              />
            </Card>
          )}
        </div>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <Card style={{
          textAlign: 'center',
          padding: '60px 40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f0f0f0',
          background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
        }}>
          <BookOutlined style={{
            fontSize: '64px',
            color: '#1890ff',
            marginBottom: '24px',
            filter: 'drop-shadow(0 2px 4px rgba(24, 144, 255, 0.2))'
          }} />
          <Title level={3} type="secondary" style={{ marginBottom: '16px' }}>
            Start Your Search
          </Title>
          <Text type="secondary" style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Enter a word above to get its definition, pronunciation, etymology, and more.
          </Text>
        </Card>
      )}
    </div>
  );
};

export default DictionaryPage;
