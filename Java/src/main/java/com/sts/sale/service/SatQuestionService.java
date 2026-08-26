package com.sts.sale.service;

import com.sts.sale.dto.AnswerRequest;
import com.sts.sale.dto.AnswerResponse;
import com.sts.sale.dto.NextQuestionRequest;
import com.sts.sale.dto.NextQuestionResponse;
import com.sts.sale.dto.QuestionBankBreakdown;
import com.sts.sale.dto.QuestionBankSummary;
import com.sts.sale.dto.SatQuestionResponse;
import com.sts.sale.mapper.QuestionAttemptMapper;
import com.sts.sale.mapper.SatQuestionMapper;
import com.sts.sale.mapper.UserAnswerRecordMapper;
import com.sts.sale.mapper.UserQuestionReviewStateMapper;
import com.sts.sale.model.QuestionAttempt;
import com.sts.sale.model.SatQuestion;
import com.sts.sale.model.UserAnswerRecord;
import com.sts.sale.model.UserQuestionReviewState;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/** SAT practice, scoring, attempt history, and review-schedule orchestration. */
@Service
public class SatQuestionService {

    private static final int MAX_BATCH_SIZE = 100;

    private final SatQuestionMapper satQuestionMapper;
    private final UserAnswerRecordMapper userAnswerRecordMapper;
    private final QuestionAttemptMapper questionAttemptMapper;
    private final UserQuestionReviewStateMapper reviewStateMapper;
    private final ReviewIntervalPolicy intervalPolicy;

    public SatQuestionService(SatQuestionMapper satQuestionMapper,
                              UserAnswerRecordMapper userAnswerRecordMapper,
                              QuestionAttemptMapper questionAttemptMapper,
                              UserQuestionReviewStateMapper reviewStateMapper,
                              ReviewIntervalPolicy intervalPolicy) {
        this.satQuestionMapper = satQuestionMapper;
        this.userAnswerRecordMapper = userAnswerRecordMapper;
        this.questionAttemptMapper = questionAttemptMapper;
        this.reviewStateMapper = reviewStateMapper;
        this.intervalPolicy = intervalPolicy;
    }

    public List<SatQuestionResponse> getRandomQuestions(int count, Long userId) {
        int limit = normalizeLimit(count);
        List<SatQuestion> questions = userId == null
            ? satQuestionMapper.getRandomQuestions(limit)
            : satQuestionMapper.getUnansweredForUser(toLegacyUserId(userId), null, limit);
        return toResponses(questions);
    }

    public List<SatQuestionResponse> getQuestionsByDomain(String domain, int count, Long userId) {
        int limit = normalizeLimit(count);
        String normalizedDomain = normalize(domain);
        if (normalizedDomain == null) {
            throw new IllegalArgumentException("A question domain is required.");
        }

        List<SatQuestion> questions = userId == null
            ? satQuestionMapper.getQuestionsByDomain(normalizedDomain, limit)
            : satQuestionMapper.getUnansweredForUser(
                toLegacyUserId(userId), normalizedDomain, limit);
        return toResponses(questions);
    }

    public List<String> getAllDomains() {
        return satQuestionMapper.getAllDomains();
    }

    /** Returns only questions admitted by the bank's quality gate. */
    public SatQuestionResponse getQuestionById(Integer id) {
        SatQuestion question = satQuestionMapper.selectUsableById(id);
        return question == null ? null : SatQuestionResponse.fromSatQuestion(question);
    }

    /** Scores only questions admitted by the bank's quality gate. */
    public AnswerResponse checkAnswer(AnswerRequest request) {
        return checkAnswer(request.getQuestionId(), request.getAnswer());
    }

    /** Pure scoring path used by the guest trial; this method never persists. */
    public AnswerResponse checkAnswer(Integer questionId, String answer) {
        SatQuestion question = requireUsableQuestion(questionId);
        return mark(question, normalizeAnswer(answer));
    }

    public NextQuestionResponse getNextQuestion(NextQuestionRequest request, Long userId) {
        String domain = normalize(request.getDomain());
        String sessionId = normalize(request.getSessionId());
        if (userId == null && sessionId == null) {
            throw new IllegalArgumentException("A practice session is required.");
        }

        List<SatQuestion> unansweredQuestions;
        long answeredCount;
        if (userId != null) {
            Integer legacyUserId = toLegacyUserId(userId);
            unansweredQuestions = satQuestionMapper.getUnansweredForUser(legacyUserId, domain, 1);
            answeredCount = satQuestionMapper.countAnsweredForUser(legacyUserId, domain);
        } else {
            unansweredQuestions = satQuestionMapper.getUnansweredForSession(sessionId, domain, 1);
            answeredCount = satQuestionMapper.countAnsweredForSession(sessionId, domain);
        }

        NextQuestionResponse response = new NextQuestionResponse();
        response.setQuestion(unansweredQuestions.isEmpty()
            ? null
            : SatQuestionResponse.fromSatQuestion(unansweredQuestions.get(0)));
        response.setHasMoreQuestions(!unansweredQuestions.isEmpty());
        response.setAnsweredCount(Math.toIntExact(answeredCount));
        response.setTotalCount(Math.toIntExact(satQuestionMapper.countUsableQuestions(domain)));
        return response;
    }

    /**
     * Appends an immutable attempt, maintains the legacy latest-answer view, and
     * advances the signed-in student's Ebbinghaus-inspired review schedule.
     * A unique client submission ID makes retries safe.
     */
    @Transactional
    public AnswerResponse submitAnswerWithRecord(AnswerRequest request, Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException(
                "Sign in is required to save answer history.");
        }
        String sessionId = normalize(request.getSessionId());
        if (request.getResponseTimeMs() != null && request.getResponseTimeMs() < 0) {
            throw new IllegalArgumentException("Response time cannot be negative.");
        }

        SatQuestion question = requireUsableQuestion(request.getQuestionId());
        String answer = normalizeAnswer(request.getAnswer());
        String submissionId = normalize(request.getSubmissionId());
        if (submissionId == null) submissionId = UUID.randomUUID().toString();

        QuestionAttempt existingAttempt = questionAttemptMapper.findBySubmissionId(submissionId);
        if (existingAttempt != null) {
            return responseForExistingAttempt(existingAttempt, question, answer, userId, sessionId);
        }

        Integer legacyUserId = toLegacyUserId(userId);
        UserQuestionReviewState currentState =
            reviewStateMapper.findForUpdate(userId, request.getQuestionId());

        LocalDateTime submittedAt = LocalDateTime.now();
        AnswerResponse response = mark(question, answer);
        ReviewSchedule schedule = intervalPolicy.defaultSchedule(
            currentState == null ? null : currentState.getStage(),
            response.getIsCorrect(),
            submittedAt
        );

        QuestionAttempt attempt = new QuestionAttempt();
        attempt.setSubmissionId(submissionId);
        attempt.setUserId(userId);
        attempt.setSessionId(sessionId);
        attempt.setQuestionId(request.getQuestionId());
        attempt.setUserAnswer(answer);
        attempt.setIsCorrect(response.getIsCorrect());
        attempt.setStudyMode(normalize(request.getStudyMode()));
        attempt.setResponseTimeMs(request.getResponseTimeMs());
        attempt.setStageBefore(currentState == null ? null : currentState.getStage());
        attempt.setDefaultStage(schedule.stage());
        attempt.setDefaultNextReviewAt(schedule.nextReviewAt());
        attempt.setSubmittedAt(submittedAt);

        if (questionAttemptMapper.insertIfAbsent(attempt) != 1) {
            QuestionAttempt concurrentAttempt = questionAttemptMapper.findBySubmissionId(submissionId);
            if (concurrentAttempt == null) {
                throw new IllegalStateException("The answer could not be saved. Please retry.");
            }
            return responseForExistingAttempt(
                concurrentAttempt, question, answer, userId, sessionId);
        }

        saveLegacyLatestAnswer(
            request.getQuestionId(), answer, response.getIsCorrect(), submittedAt,
            sessionId, legacyUserId);

        saveReviewState(
            currentState, userId, request.getQuestionId(), response.getIsCorrect(),
            submittedAt, attempt.getId(), schedule);
        applySchedule(response, schedule.stage(), schedule.nextReviewAt(), schedule.interval());

        return response;
    }

    /** Rebuilds a score response only if the recorded question remains usable. */
    public AnswerResponse getRecordedAnswer(Integer questionId, Long userId, String sessionId) {
        UserAnswerRecord record;
        if (userId != null) {
            record = userAnswerRecordMapper.findLatestByUserIdAndQuestionId(
                toLegacyUserId(userId), questionId);
        } else {
            String normalizedSessionId = normalize(sessionId);
            if (normalizedSessionId == null) return null;
            record = userAnswerRecordMapper.findLatestBySessionIdAndQuestionId(
                normalizedSessionId, questionId);
        }
        if (record == null) return null;

        SatQuestion question = requireUsableQuestion(questionId);
        AnswerResponse response = mark(question, normalizeAnswer(record.getUserAnswer()));
        if (userId != null) {
            UserQuestionReviewState state = reviewStateMapper.find(userId, questionId);
            if (state != null) {
                Duration interval = durationBetween(
                    state.getLastAnsweredAt(), state.getNextReviewAt());
                applySchedule(response, state.getStage(), state.getNextReviewAt(), interval);
            }
        }
        return response;
    }

    public QuestionBankSummary getQuestionBankSummary() {
        QuestionBankSummary summary = new QuestionBankSummary();
        summary.setTotalQuestions(satQuestionMapper.countAllQuestions());
        summary.setUsableQuestions(satQuestionMapper.countUsableQuestions(null));
        summary.setQuarantinedQuestions(satQuestionMapper.countQuarantinedQuestions());
        summary.setDuplicateQuestions(satQuestionMapper.countDuplicateQuestions());
        summary.setByDomain(toBreakdownMap(satQuestionMapper.getUsableCountsByDomain()));
        summary.setByQualityStatus(toBreakdownMap(satQuestionMapper.getCountsByQualityStatus()));
        return summary;
    }

    public String generateSessionId() {
        return UUID.randomUUID().toString();
    }

    private SatQuestion requireUsableQuestion(Integer questionId) {
        SatQuestion question = satQuestionMapper.selectUsableById(questionId);
        if (question == null) {
            throw new IllegalArgumentException(
                "This question is unavailable because it did not pass the quality screen.");
        }
        getVerifiedAnswerKey(question);
        return question;
    }

    private AnswerResponse mark(SatQuestion question, String submittedAnswer) {
        AnswerResponse response = new AnswerResponse();
        response.setQuestionId(question.getId());
        response.setUserAnswer(submittedAnswer);
        response.setCorrectAnswer(getVerifiedAnswerKey(question));
        response.setIsCorrect(response.getCorrectAnswer().equals(submittedAnswer));
        response.setExplanation(question.getQuestionExplanation());
        return response;
    }

    private String getVerifiedAnswerKey(SatQuestion question) {
        String answerKey = normalize(question.getCorrectAnswer());
        if (answerKey == null || !answerKey.toUpperCase().matches("[A-D]")) {
            throw new IllegalStateException(
                "This question does not have a verified answer key and cannot be scored.");
        }
        return answerKey.toUpperCase();
    }

    private String normalizeAnswer(String answer) {
        String normalized = normalize(answer);
        if (normalized == null || !normalized.toUpperCase().matches("[A-D]")) {
            throw new IllegalArgumentException("Answer must be A, B, C, or D.");
        }
        return normalized.toUpperCase();
    }

    private AnswerResponse responseForExistingAttempt(QuestionAttempt attempt,
                                                       SatQuestion question,
                                                       String submittedAnswer,
                                                       Long userId,
                                                       String sessionId) {
        if (!question.getId().equals(attempt.getQuestionId())
                || !submittedAnswer.equals(attempt.getUserAnswer())) {
            throw new IllegalArgumentException(
                "This submission ID was already used for a different answer.");
        }

        if (userId != null) {
            if (!userId.equals(attempt.getUserId())) {
                throw new IllegalArgumentException(
                    "This submission ID belongs to a different account.");
            }
        } else if (attempt.getUserId() != null
                || !Objects.equals(sessionId, normalize(attempt.getSessionId()))) {
            throw new IllegalArgumentException(
                "This submission ID belongs to a different practice session.");
        }

        AnswerResponse response = mark(question, attempt.getUserAnswer());
        if (attempt.getUserId() != null && attempt.getDefaultStage() != null) {
            Duration interval = durationBetween(
                attempt.getSubmittedAt(), attempt.getDefaultNextReviewAt());
            applySchedule(
                response,
                attempt.getDefaultStage(),
                attempt.getDefaultNextReviewAt(),
                interval
            );
        }
        return response;
    }

    private void saveLegacyLatestAnswer(Integer questionId,
                                        String answer,
                                        Boolean isCorrect,
                                        LocalDateTime answeredAt,
                                        String sessionId,
                                        Integer userId) {
        UserAnswerRecord record = userId == null
            ? userAnswerRecordMapper.findLatestBySessionIdAndQuestionId(sessionId, questionId)
            : userAnswerRecordMapper.findLatestByUserIdAndQuestionId(userId, questionId);
        boolean insert = record == null;
        if (insert) {
            record = new UserAnswerRecord();
            record.setQuestionId(questionId);
        }
        record.setUserId(userId);
        record.setSessionId(sessionId);
        record.setUserAnswer(answer);
        record.setIsCorrect(isCorrect);
        record.setAnsweredAt(answeredAt);
        if (insert) userAnswerRecordMapper.insert(record);
        else userAnswerRecordMapper.updateById(record);
    }

    private void saveReviewState(UserQuestionReviewState state,
                                 Long userId,
                                 Integer questionId,
                                 boolean correct,
                                 LocalDateTime submittedAt,
                                 Long attemptId,
                                 ReviewSchedule schedule) {
        boolean firstAttempt = state == null;
        if (firstAttempt) {
            state = new UserQuestionReviewState();
            state.setUserId(userId);
            state.setQuestionId(questionId);
        }
        int previousStreak = value(state.getCorrectStreak());
        int previousLapses = value(state.getLapseCount());
        int previousAttempts = value(state.getTotalAttempts());
        state.setStage(schedule.stage());
        state.setNextReviewAt(schedule.nextReviewAt());
        state.setLastAnsweredAt(submittedAt);
        state.setLastCorrect(correct);
        state.setCorrectStreak(correct ? previousStreak + 1 : 0);
        state.setLapseCount(previousLapses + (correct ? 0 : 1));
        state.setTotalAttempts(firstAttempt ? 1 : previousAttempts + 1);
        state.setLastAttemptId(attemptId);
        state.setLastGrade(correct ? "GOOD" : "AGAIN");
        reviewStateMapper.save(state);
    }

    private void applySchedule(AnswerResponse response,
                               Integer stage,
                               LocalDateTime nextReviewAt,
                               Duration interval) {
        response.setReviewStage(stage);
        response.setNextReviewAt(nextReviewAt);
        response.setIntervalMinutes(interval == null ? null : interval.toMinutes());
    }

    private Duration durationBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return null;
        Duration duration = Duration.between(start, end);
        return duration.isNegative() ? Duration.ZERO : duration;
    }

    private List<SatQuestionResponse> toResponses(List<SatQuestion> questions) {
        return questions.stream().map(SatQuestionResponse::fromSatQuestion).toList();
    }

    private Map<String, Long> toBreakdownMap(List<QuestionBankBreakdown> rows) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (QuestionBankBreakdown row : rows) {
            if (row.getLabel() != null) {
                result.merge(row.getLabel(), row.getCount() == null ? 0L : row.getCount(), Long::sum);
            }
        }
        return result;
    }

    private int normalizeLimit(int count) {
        return Math.max(1, Math.min(MAX_BATCH_SIZE, count));
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }

    private Integer toLegacyUserId(Long userId) {
        try {
            return Math.toIntExact(userId);
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException("The authenticated user ID is out of range.");
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
