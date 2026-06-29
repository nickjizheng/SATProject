import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Space, Tag, Divider, List, Button, message } from 'antd';
import { SoundOutlined, CalendarOutlined, BookOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import type { DictionaryResponse } from '../types/dictionary';
import { FavoriteWordService } from '../services/favoriteWordService';
import { getPronunciationAudioUrl } from '../utils/dictionaryAudio';

const { Title, Text } = Typography;

interface DictionaryResultProps {
  data: DictionaryResponse[];
}

const DictionaryResult: React.FC<DictionaryResultProps> = ({ data }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      checkFavoriteStatus();
    }

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [data]);

  const playPronunciation = async (audioName: string) => {
    audioRef.current?.pause();

    const audio = new Audio(getPronunciationAudioUrl(audioName));
    audioRef.current = audio;
    setPlayingAudio(audioName);

    const finish = () => {
      setPlayingAudio(null);
      if (audioRef.current === audio) audioRef.current = null;
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });

    try {
      await audio.play();
    } catch (error) {
      finish();
      console.error('Failed to play pronunciation:', error);
      message.error('Pronunciation audio could not be played.');
    }
  };

  const checkFavoriteStatus = async () => {
    if (data && data.length > 0) {
      try {
        const word = data[0].hwi?.hw?.replace(/\*/g, '') || '';
        const favorited = await FavoriteWordService.checkFavoriteStatus(word);
        setIsFavorited(favorited);
      } catch (error) {
        console.error('Failed to check favorite status:', error);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!data || data.length === 0) return;

    setLoading(true);
    try {
      const word = data[0].hwi?.hw?.replace(/\*/g, '') || '';
      const wordData = JSON.stringify(data[0]);

      if (isFavorited) {
        await FavoriteWordService.removeFavoriteWord(word);
        setIsFavorited(false);
        message.success('Removed from favorites.');
      } else {
        await FavoriteWordService.addFavoriteWord({
          word,
          wordData
        });
        setIsFavorited(true);
        message.success('Added to favorites.');
      }
    } catch (error) {
      console.error('Failed to update favorite word:', error);
      message.error('That action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card style={{ marginTop: '16px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="secondary">No definition found for this word.</Text>
        </div>
      </Card>
    );
  }



  return (
    <div style={{ marginTop: '16px' }}>
      {data.slice(0, 1).map((entry, index) => {
        // Skip entries that don't have the basic required structure
        if (!entry || !entry.meta || !entry.hwi) {
          return null;
        }

        const pronunciation = entry.hwi.prs?.find(item => item.sound?.audio) ?? entry.hwi.prs?.[0];
        const audioName = pronunciation?.sound?.audio;

        return (
          <Card
            key={entry.meta.uuid || index}
            style={{
              marginBottom: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f0f0f0'
            }}
          >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header with word and pronunciation */}
            <div style={{
              background: 'linear-gradient(135deg, #f6f9ff 0%, #e6f7ff 100%)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e6f7ff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2} style={{
                  margin: 0,
                  color: '#1890ff',
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {entry.hwi?.hw && typeof entry.hwi.hw === 'string' ? entry.hwi.hw.replace(/\*/g, '') : 'Unknown Word'}
                </Title>
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
              <Space size="middle" style={{ marginTop: '12px' }}>
                {entry.fl && (
                  <Tag
                    color="blue"
                    style={{
                      fontSize: '14px',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontWeight: 500
                    }}
                  >
                    {entry.fl}
                  </Tag>
                )}
                {entry.lbs && entry.lbs.length > 0 && (
                  <Tag
                    color="green"
                    style={{
                      fontSize: '12px',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontWeight: 500
                    }}
                  >
                    {entry.lbs.join(', ')}
                  </Tag>
                )}
                {pronunciation && (
                  <Button
                    icon={<SoundOutlined />}
                    disabled={!audioName}
                    loading={playingAudio === audioName}
                    onClick={() => audioName && void playPronunciation(audioName)}
                    title={audioName ? 'Play pronunciation' : 'No pronunciation audio available'}
                    style={{ height: '38px', borderRadius: '8px' }}
                  >
                    <Text code style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#262626'
                    }}>
                      {pronunciation.mw || 'Pronunciation'}
                    </Text>
                  </Button>
                )}
              </Space>
            </div>

            <Divider />

            {/* Short definitions */}
            {entry.shortdef && entry.shortdef.length > 0 && (
              <div style={{
                background: '#f6ffed',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #b7eb8f'
              }}>
                <Title level={4} style={{
                  color: '#52c41a',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <BookOutlined style={{ marginRight: '8px' }} />
                  Quick Definitions
                </Title>
                <List
                  size="small"
                  dataSource={entry.shortdef}
                  renderItem={(def, idx) => (
                    <List.Item style={{
                      padding: '8px 0',
                      borderBottom: idx < entry.shortdef.length - 1 ? '1px solid #e8f5e8' : 'none'
                    }}>
                      <Text style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: '#262626'
                      }}>
                        <span style={{
                          color: '#52c41a',
                          fontWeight: 600,
                          marginRight: '8px'
                        }}>
                          {idx + 1}.
                        </span>
                        {def}
                      </Text>
                    </List.Item>
                  )}
                />
              </div>
            )}




            {/* Related words */}
            {entry.uros && entry.uros.length > 0 && (
              <div style={{
                background: '#e6fffb',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #87e8de'
              }}>
                <Title level={4} style={{
                  color: '#13c2c2',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <BookOutlined style={{ marginRight: '8px' }} />
                  Related Words
                </Title>
                <Space wrap>
                  {entry.uros.map((uro, idx) => (
                    <Tag
                      key={idx}
                      color="cyan"
                      style={{
                        fontSize: '14px',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontWeight: 500
                      }}
                    >
                      {uro?.ure && typeof uro.ure === 'string' ? uro.ure.replace(/\*/g, '') : ''} {uro?.fl ? `(${uro.fl})` : ''}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}


            {/* First recorded date */}
            {entry.date && (
              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <Space size="small">
                  <CalendarOutlined />
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    First recorded: {entry.date && typeof entry.date === 'string' ? entry.date.replace(/\{ds\|\|\|\|\}/g, '') : entry.date}
                  </Text>
                </Space>
              </div>
            )}
          </Space>
        </Card>
        );
      })}
    </div>
  );
};

export default DictionaryResult;
