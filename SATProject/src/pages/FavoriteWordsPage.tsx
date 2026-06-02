import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, List, Tag, message, Spin, Empty } from 'antd';
import { HeartFilled, SoundOutlined, CalendarOutlined, DeleteOutlined } from '@ant-design/icons';
import { FavoriteWordService, type FavoriteWordResponse } from '../services/favoriteWordService';

const { Title, Text } = Typography;

const FavoriteWordsPage: React.FC = () => {
  const [favoriteWords, setFavoriteWords] = useState<FavoriteWordResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadFavoriteWords();
  }, []);

  const loadFavoriteWords = async () => {
    setLoading(true);
    try {
      const words = await FavoriteWordService.getFavoriteWords();
      setFavoriteWords(words);
    } catch (error) {
      console.error('加载收藏单词失败:', error);
      message.error('加载收藏单词失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (word: string, id: number) => {
    setDeletingId(id);
    try {
      await FavoriteWordService.removeFavoriteWord(word);
      setFavoriteWords(prev => prev.filter(item => item.id !== id));
      message.success('已取消收藏');
    } catch (error) {
      console.error('取消收藏失败:', error);
      message.error('取消收藏失败');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', marginTop: '120px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={1} style={{ color: '#ff4d4f', marginBottom: '8px' }}>
          <HeartFilled style={{ marginRight: '12px' }} />
          我收藏的单词
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          管理您收藏的单词，随时复习
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>加载收藏单词中...</div>
        </div>
      ) : favoriteWords.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有收藏任何单词"
          />
        </Card>
      ) : (
        <List
          dataSource={favoriteWords}
          renderItem={(item) => (
            <List.Item>
              <Card
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #f0f0f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <Title level={3} style={{ margin: 0, marginRight: '16px', color: '#1890ff' }}>
                        {item.word}
                      </Title>
                      <Space>
                        {item.partOfSpeech && (
                          <Tag color="blue" style={{ fontSize: '12px' }}>
                            {item.partOfSpeech}
                          </Tag>
                        )}
                        {item.pronunciation && (
                          <Space size="small" style={{ 
                            background: '#fafafa',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #e8e8e8'
                          }}>
                            <SoundOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
                            <Text code style={{ fontSize: '12px' }}>
                              {item.pronunciation}
                            </Text>
                          </Space>
                        )}
                      </Space>
                    </div>
                    
                    {item.shortDefinition && (
                      <div style={{ marginBottom: '12px' }}>
                        <Text style={{ fontSize: '15px', lineHeight: '1.6' }}>
                          {item.shortDefinition}
                        </Text>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                      <CalendarOutlined style={{ marginRight: '4px', fontSize: '12px' }} />
                      <Text style={{ fontSize: '12px' }}>
                        收藏于 {formatDate(item.createdAt)}
                      </Text>
                    </div>
                  </div>
                  
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFavorite(item.word, item.id)}
                    loading={deletingId === item.id}
                    style={{
                      marginLeft: '16px',
                      flexShrink: 0
                    }}
                  >
                    取消收藏
                  </Button>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default FavoriteWordsPage;
