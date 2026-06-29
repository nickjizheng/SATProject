import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Space, Button, List, Tag, message, Spin, Empty } from 'antd';
import { HeartFilled, SoundOutlined, CalendarOutlined, DeleteOutlined } from '@ant-design/icons';
import { FavoriteWordService, type FavoriteWordResponse } from '../services/favoriteWordService';
import { DictionaryService } from '../services/dictionaryService';
import { findPronunciationAudio, getPronunciationAudioUrl, parseSavedDictionaryEntry } from '../utils/dictionaryAudio';

const { Title, Text } = Typography;

const FavoriteWordsPage: React.FC = () => {
  const [favoriteWords, setFavoriteWords] = useState<FavoriteWordResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadFavoriteWords();
    return () => audioRef.current?.pause();
  }, []);

  const handlePlayPronunciation = async (item: FavoriteWordResponse) => {
    audioRef.current?.pause();
    setPlayingId(item.id);

    try {
      let audioName = findPronunciationAudio(parseSavedDictionaryEntry(item.wordData));
      if (!audioName) {
        const liveEntries = await DictionaryService.getWordDefinition(item.word);
        audioName = findPronunciationAudio(liveEntries);
      }

      if (!audioName) {
        message.warning(`No pronunciation recording is available for “${item.word}”.`);
        return;
      }

      const audio = new Audio(getPronunciationAudioUrl(audioName));
      audioRef.current = audio;
      const finish = () => {
        setPlayingId(null);
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.addEventListener('ended', finish, { once: true });
      audio.addEventListener('error', finish, { once: true });
      await audio.play();
    } catch (error) {
      console.error('Failed to play saved-word pronunciation:', error);
      message.error('Pronunciation audio could not be played.');
    } finally {
      if (!audioRef.current || audioRef.current.paused) setPlayingId(null);
    }
  };

  const loadFavoriteWords = async () => {
    setLoading(true);
    try {
      const words = await FavoriteWordService.getFavoriteWords();
      setFavoriteWords(words);
    } catch (error) {
      console.error('Failed to load favorite words:', error);
      message.error('Failed to load favorite words.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (word: string, id: number) => {
    setDeletingId(id);
    try {
      await FavoriteWordService.removeFavoriteWord(word);
      setFavoriteWords(prev => prev.filter(item => item.id !== id));
      message.success('Removed from favorites.');
    } catch (error) {
      console.error('Failed to remove favorite word:', error);
      message.error('Failed to remove favorite word.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="favorite-words-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', marginTop: '120px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={1} style={{ color: '#ff4d4f', marginBottom: '8px' }}>
          <HeartFilled style={{ marginRight: '12px' }} />
          My Favorite Words
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Review and manage the words you have saved.
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading favorite words...</div>
        </div>
      ) : favoriteWords.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="You have not saved any words yet."
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                      <Title level={3} style={{ margin: 0, color: '#1890ff', overflowWrap: 'anywhere' }}>
                        {item.word}
                      </Title>
                      <Space wrap>
                        {item.partOfSpeech && (
                          <Tag color="blue" style={{ fontSize: '12px' }}>
                            {item.partOfSpeech}
                          </Tag>
                        )}
                        <Button
                          size="small"
                          icon={<SoundOutlined />}
                          loading={playingId === item.id}
                          onClick={() => void handlePlayPronunciation(item)}
                          title={`Play pronunciation for ${item.word}`}
                          style={{
                            background: '#fafafa',
                            borderRadius: '4px',
                            border: '1px solid #e8e8e8'
                          }}>
                          <Text code style={{ fontSize: '12px', overflowWrap: 'anywhere' }}>
                            {item.pronunciation || 'Play pronunciation'}
                          </Text>
                        </Button>
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
                        Saved on {formatDate(item.createdAt)}
                      </Text>
                    </div>
                  </div>

                  <Button
                    className="favorite-word-remove"
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
                    Remove
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
