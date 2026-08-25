import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  LineChartOutlined,
  ReloadOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import SatQuestionCard from '../components/SatQuestionCard';
import { ReviewService } from '../services/reviewService';
import { SatService } from '../services/satService';
import type { AnswerResponse } from '../types/sat';
import type {
  ReviewForecastPoint,
  ReviewGrade,
  ReviewQueueItem,
  ReviewSummary,
} from '../types/review';

const { Paragraph, Text, Title } = Typography;

const REVIEW_SESSION_KEY = 'sat-review-session-id';

const createUniqueId = (prefix: string) => {
  const randomPart = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomPart}`;
};

const getLocalReviewSession = () => {
  const savedSession = sessionStorage.getItem(REVIEW_SESSION_KEY);
  if (savedSession) return savedSession;

  const newSession = createUniqueId('review-session');
  sessionStorage.setItem(REVIEW_SESSION_KEY, newSession);
  return newSession;
};

const formatInterval = (minutes?: number) => {
  if (minutes === undefined || !Number.isFinite(minutes)) return 'a personalized interval';
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  if (minutes < 1440) {
    const hours = minutes / 60;
    return `${hours < 10 ? hours.toFixed(1).replace('.0', '') : Math.round(hours)} hr`;
  }
  const days = minutes / 1440;
  return `${days < 10 ? days.toFixed(1).replace('.0', '') : Math.round(days)} day${days === 1 ? '' : 's'}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'No review is scheduled yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatForecastDay = (value: string) => {
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' }).format(date);
};

const describeDue = (item: ReviewQueueItem) => {
  if (item.overdueMinutes <= 0) return 'Due now';
  if (item.overdueMinutes < 60) return `${Math.round(item.overdueMinutes)} min overdue`;
  if (item.overdueMinutes < 1440) return `${Math.round(item.overdueMinutes / 60)} hr overdue`;
  return `${Math.round(item.overdueMinutes / 1440)} days overdue`;
};

interface SummaryCardProps {
  className: string;
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
}

function SummaryCard({ className, icon, label, value, detail }: SummaryCardProps) {
  return (
    <Card className={`metric-card ${className}`} style={{ height: '100%', border: 0 }}>
      <Statistic
        title={<span style={{ color: 'rgba(255,255,255,.7)', fontWeight: 700 }}>{label}</span>}
        value={value}
        prefix={icon}
        valueStyle={{ color: '#fff', fontFamily: 'Newsreader Variable, serif', fontSize: 34 }}
      />
      <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 12 }}>{detail}</Text>
    </Card>
  );
}

interface ForecastChartProps {
  points: ReviewForecastPoint[];
}

function ForecastChart({ points }: ForecastChartProps) {
  const maxDue = Math.max(1, ...points.map(point => point.dueCount));

  if (!points.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Your forecast will appear after you answer a question." />;
  }

  return (
    <div
      role="img"
      aria-label={`Seven-day review forecast: ${points.map(point => `${formatForecastDay(point.date)}, ${point.dueCount}`).join('; ')}`}
      style={{ display: 'flex', alignItems: 'flex-end', gap: 10, minHeight: 176, paddingTop: 14 }}
    >
      {points.map(point => {
        const height = point.dueCount === 0 ? 5 : Math.max(18, Math.round((point.dueCount / maxDue) * 116));
        return (
          <div key={point.date} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <Text strong style={{ display: 'block', color: '#115e59', marginBottom: 7 }}>
              {point.dueCount}
            </Text>
            <div
              title={`${point.dueCount} review${point.dueCount === 1 ? '' : 's'} due`}
              style={{
                width: 'min(100%, 38px)',
                height,
                margin: '0 auto 9px',
                borderRadius: '9px 9px 4px 4px',
                background: point.dueCount
                  ? 'linear-gradient(180deg, #e96b4d 0%, #c9563d 100%)'
                  : 'rgba(17,94,89,.12)',
                boxShadow: point.dueCount ? '0 8px 18px rgba(201,86,61,.18)' : 'none',
              }}
            />
            <Text type="secondary" style={{ display: 'block', fontSize: 10, whiteSpace: 'nowrap' }}>
              {formatForecastDay(point.date)}
            </Text>
          </div>
        );
      })}
    </div>
  );
}

const gradeDetails: Record<ReviewGrade, { label: string; detail: string; color: string }> = {
  again: { label: 'Again', detail: 'I missed the idea', color: '#b84432' },
  hard: { label: 'Hard', detail: 'It took real effort', color: '#bf7b1f' },
  good: { label: 'Good', detail: 'The timing feels right', color: '#13746c' },
  easy: { label: 'Easy', detail: 'Give me a longer gap', color: '#315f87' },
};

export default function ReviewPage() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [forecast, setForecast] = useState<ReviewForecastPoint[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adjusting, setAdjusting] = useState<ReviewGrade | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [lastGrade, setLastGrade] = useState<ReviewGrade | null>(null);
  const [sessionId] = useState(getLocalReviewSession);
  const questionStartedAt = useRef(Date.now());
  const submissionId = useRef(createUniqueId('review-attempt'));
  const submitInFlight = useRef(false);
  const adjustInFlight = useRef(false);

  const currentItem = queue[0];
  const currentQuestionId = currentItem?.question.id;

  const loadReviewData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setLoadError(null);
    try {
      const [nextSummary, nextQueue, nextForecast] = await Promise.all([
        ReviewService.getSummary(),
        ReviewService.getQueue(20),
        ReviewService.getForecast(7),
      ]);
      setSummary(nextSummary);
      setQueue(nextQueue);
      setForecast(nextForecast);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Review data could not be loaded.';
      setLoadError(detail);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviewData();
  }, [loadReviewData]);

  useEffect(() => {
    questionStartedAt.current = Date.now();
    submissionId.current = createUniqueId(`review-${currentQuestionId ?? 'queue'}`);
    setSelectedAnswer('');
    setAnswerResult(null);
    setSubmitError(null);
    setAdjustError(null);
    setLastGrade(null);
  }, [currentQuestionId]);

  const retentionPercent = useMemo(() => {
    const estimate = summary?.retentionEstimate ?? 0;
    return Math.max(0, Math.min(100, Math.round(estimate <= 1 && estimate > 0 ? estimate * 100 : estimate)));
  }, [summary?.retentionEstimate]);

  const handleAnswerSelect = (answer: string) => {
    if (!answerResult && !submitting) setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!currentItem || !selectedAnswer || answerResult || submitInFlight.current) return;

    submitInFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await SatService.submitAnswerWithRecord({
        questionId: currentItem.question.id,
        answer: selectedAnswer,
        sessionId,
        submissionId: submissionId.current,
        studyMode: 'review',
        responseTimeMs: Math.max(0, Date.now() - questionStartedAt.current),
      });
      setAnswerResult(result);
      message.success(result.isCorrect ? 'Correct — now tune the interval.' : 'Logged — choose when this should return.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your answer could not be saved.');
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentItem || !answerResult || adjustInFlight.current) return;

    adjustInFlight.current = true;
    setAdjusting(grade);
    setLastGrade(grade);
    setAdjustError(null);
    try {
      const adjustment = await ReviewService.adjust(currentItem.question.id, grade);
      const scheduledInterval = adjustment.intervalMinutes ?? answerResult.intervalMinutes;
      message.success(`${gradeDetails[grade].label}: next review in ${formatInterval(scheduledInterval)}.`);

      setQueue(previous => previous.slice(1));
      await loadReviewData(false);
    } catch (error) {
      setAdjustError(error instanceof Error ? error.message : 'The interval could not be updated.');
    } finally {
      adjustInFlight.current = false;
      setAdjusting(null);
    }
  };

  if (loading) {
    return (
      <div className="page-shell grid min-h-[70vh] place-items-center" aria-live="polite">
        <Space direction="vertical" align="center" size="middle">
          <Spin size="large" />
          <Text type="secondary">Building today&apos;s memory queue…</Text>
        </Space>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 22,
          padding: 'clamp(25px, 5vw, 52px)',
          borderRadius: 30,
          color: '#fff',
          background: 'linear-gradient(132deg, #143f3b 0%, #0f655e 64%, #167b70 100%)',
          boxShadow: '0 28px 70px rgba(17,94,89,.2)',
        }}
      >
        <div aria-hidden="true" style={{ position: 'absolute', width: 230, height: 230, right: -60, top: -95, borderRadius: '50%', border: '46px solid rgba(233,107,77,.22)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', width: 130, height: 130, right: 120, bottom: -95, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ position: 'relative', maxWidth: 760 }}>
          <p style={{ margin: 0, color: '#ffab92', fontSize: 12, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase' }}>
            Spaced review · Ebbinghaus rhythm
          </p>
          <Title level={1} style={{ margin: '10px 0 6px', color: '#fff', fontSize: 'clamp(2.4rem, 6vw, 5rem)', lineHeight: .96 }}>
            Remember it longer.
          </Title>
          <Paragraph style={{ maxWidth: 650, margin: '14px 0 0', color: 'rgba(255,255,255,.7)', fontSize: 16, lineHeight: 1.7 }}>
            Today&apos;s queue brings ideas back just as they begin to fade. Answer naturally, then tell the scheduler how the recall felt.
          </Paragraph>
        </div>
      </section>

      {loadError && (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          message="Your review schedule could not be loaded"
          description={loadError}
          action={<Button icon={<ReloadOutlined />} onClick={() => void loadReviewData()}>Retry</Button>}
        />
      )}

      <Row gutter={[16, 16]} className="mb-5">
        <Col xs={12} lg={6}>
          <SummaryCard className="metric-coral" icon={<ClockCircleOutlined />} label="Due now" value={summary?.dueNow ?? 0} detail="Ready for recall" />
        </Col>
        <Col xs={12} lg={6}>
          <SummaryCard className="metric-teal" icon={<FireOutlined />} label="Learning" value={summary?.learning ?? 0} detail="Building strength" />
        </Col>
        <Col xs={12} lg={6}>
          <SummaryCard className="metric-ink" icon={<TrophyOutlined />} label="Mastered" value={summary?.mastered ?? 0} detail="Long-interval cards" />
        </Col>
        <Col xs={12} lg={6}>
          <SummaryCard className="metric-ochre" icon={<CheckCircleOutlined />} label="Reviewed today" value={summary?.reviewedToday ?? 0} detail={`${summary?.totalScheduled ?? 0} scheduled total`} />
        </Col>
      </Row>

      <Row gutter={[20, 20]} align="top">
        <Col xs={24} xl={16}>
          {currentItem ? (
            <>
              <Card className="mb-4" styles={{ body: { padding: '18px clamp(16px, 3vw, 28px)' } }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Space wrap size={[8, 8]}>
                    <Tag color="volcano">{currentItem.statusLabel || 'Due now'}</Tag>
                    <Tag color="cyan">Stage {currentItem.stage}</Tag>
                    <Tag>{describeDue(currentItem)}</Tag>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {queue.length} card{queue.length === 1 ? '' : 's'} in this queue
                  </Text>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress percent={Math.min(100, Math.round((currentItem.reviewCount / Math.max(1, currentItem.reviewCount + queue.length)) * 100))} showInfo={false} style={{ margin: 0 }} />
                  <Text type="secondary" style={{ flexShrink: 0, fontSize: 11 }}>{currentItem.reviewCount} reviews</Text>
                </div>
              </Card>

              {submitError && (
                <Alert
                  className="mb-4"
                  type="error"
                  showIcon
                  message="Your answer was not saved"
                  description={submitError}
                  action={<Button size="small" onClick={() => void handleSubmitAnswer()}>Retry</Button>}
                />
              )}

              <Card styles={{ body: { padding: 'clamp(16px, 3vw, 28px)' } }}>
                <Spin spinning={submitting} tip="Saving your recall…">
                  <SatQuestionCard
                    question={currentItem.question}
                    selectedAnswer={selectedAnswer}
                    onAnswerSelect={handleAnswerSelect}
                    onSubmitAnswer={() => void handleSubmitAnswer()}
                    answerResult={answerResult}
                    showAnswer={Boolean(answerResult)}
                    submitting={submitting}
                  />
                </Spin>
              </Card>

              {answerResult && (
                <Card
                  className="mt-4"
                  style={{ borderColor: 'rgba(17,94,89,.28)' }}
                  styles={{ body: { padding: 'clamp(18px, 4vw, 30px)' } }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="page-kicker">Tune the memory interval</p>
                      <Title level={3} style={{ margin: '5px 0 4px' }}>How did that recall feel?</Title>
                      <Text type="secondary">The automatic schedule is <Text strong>{formatInterval(answerResult.intervalMinutes ?? currentItem.intervalMinutes)}</Text>{answerResult.nextReviewAt ? ` · ${formatDateTime(answerResult.nextReviewAt)}` : ''}.</Text>
                    </div>
                    {answerResult.reviewStage !== undefined && <Tag color="cyan">New stage {answerResult.reviewStage}</Tag>}
                  </div>

                  {adjustError && (
                    <Alert
                      className="mt-4"
                      type="error"
                      showIcon
                      message="That rating was not saved"
                      description={adjustError}
                      action={lastGrade ? <Button size="small" onClick={() => void handleGrade(lastGrade)}>Retry</Button> : undefined}
                    />
                  )}

                  <Row gutter={[10, 10]} className="mt-5">
                    {(Object.keys(gradeDetails) as ReviewGrade[]).map(grade => {
                      const detail = gradeDetails[grade];
                      return (
                        <Col xs={12} md={6} key={grade}>
                          <Button
                            block
                            size="large"
                            loading={adjusting === grade}
                            disabled={adjusting !== null && adjusting !== grade}
                            aria-label={`${detail.label}: ${detail.detail}`}
                            onClick={() => void handleGrade(grade)}
                            style={{ height: 66, borderColor: detail.color, color: detail.color, whiteSpace: 'normal', lineHeight: 1.15 }}
                          >
                            <span><strong>{detail.label}</strong><small style={{ display: 'block', marginTop: 4, opacity: .7 }}>{detail.detail}</small></span>
                          </Button>
                        </Col>
                      );
                    })}
                  </Row>
                </Card>
              )}
            </>
          ) : summary ? (
            <Card styles={{ body: { padding: 'clamp(35px, 8vw, 88px) 24px' } }}>
              <Empty
                image={<CheckCircleOutlined style={{ color: '#178478', fontSize: 70 }} />}
                description={
                  <div>
                    <Title level={2} style={{ marginBottom: 6 }}>You&apos;re caught up.</Title>
                    <Paragraph type="secondary" style={{ maxWidth: 480, margin: '0 auto 20px' }}>
                      The forgetting curve is quiet for now. Your next scheduled review is {formatDateTime(summary?.nextDueAt).toLowerCase()}.
                    </Paragraph>
                    <Button type="primary" icon={<ReloadOutlined />} onClick={() => void loadReviewData()}>
                      Check again
                    </Button>
                  </div>
                }
              />
            </Card>
          ) : (
            <Card styles={{ body: { padding: 'clamp(35px, 8vw, 72px) 24px' } }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={3} style={{ marginBottom: 6 }}>Your queue is temporarily unavailable.</Title>
                    <Paragraph type="secondary">Retry when you&apos;re ready; no review progress has been changed.</Paragraph>
                    <Button type="primary" icon={<ReloadOutlined />} onClick={() => void loadReviewData()}>
                      Retry review data
                    </Button>
                  </div>
                }
              />
            </Card>
          )}
        </Col>

        <Col xs={24} xl={8}>
          <Card title={<Space><LineChartOutlined style={{ color: '#e96b4d' }} />Next seven days</Space>} className="mb-5">
            <ForecastChart points={forecast} />
          </Card>

          <Card title={<Space><CalendarOutlined style={{ color: '#115e59' }} />Memory outlook</Space>}>
            <div className="flex flex-col items-center py-3 text-center">
              <Progress
                type="circle"
                percent={retentionPercent}
                size={146}
                strokeColor={{ '0%': '#115e59', '100%': '#36a99d' }}
                trailColor="rgba(17,94,89,.09)"
                format={percent => <span style={{ color: '#153e3a', fontFamily: 'Newsreader Variable, serif', fontSize: 27 }}>{percent}%</span>}
              />
              <Title level={4} style={{ margin: '18px 0 4px' }}>Estimated retention</Title>
              <Paragraph type="secondary" style={{ margin: 0, maxWidth: 270, fontSize: 13 }}>
                A live estimate based on where your scheduled cards sit on the forgetting curve.
              </Paragraph>
            </div>
            <div style={{ marginTop: 15, padding: 16, borderRadius: 16, background: 'rgba(17,94,89,.06)', border: '1px solid rgba(17,94,89,.09)' }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>Next review</Text>
              <Text strong style={{ display: 'block', marginTop: 5 }}><ClockCircleOutlined style={{ color: '#e96b4d', marginRight: 7 }} />{formatDateTime(summary?.nextDueAt)}</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
