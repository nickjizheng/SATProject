package com.sts.sale.service;

import com.sts.sale.dto.ReviewForecastDay;
import com.sts.sale.dto.ReviewGradeRequest;
import com.sts.sale.dto.ReviewQueueItem;
import com.sts.sale.dto.ReviewScheduleResponse;
import com.sts.sale.dto.ReviewSummary;
import com.sts.sale.mapper.QuestionAttemptMapper;
import com.sts.sale.mapper.SatQuestionMapper;
import com.sts.sale.mapper.UserQuestionReviewStateMapper;
import com.sts.sale.model.QuestionAttempt;
import com.sts.sale.model.ReviewForecastBucket;
import com.sts.sale.model.UserQuestionReviewState;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {

    private final UserQuestionReviewStateMapper reviewStateMapper;
    private final QuestionAttemptMapper questionAttemptMapper;
    private final SatQuestionMapper satQuestionMapper;
    private final ReviewIntervalPolicy intervalPolicy;

    public ReviewService(UserQuestionReviewStateMapper reviewStateMapper,
                         QuestionAttemptMapper questionAttemptMapper,
                         SatQuestionMapper satQuestionMapper,
                         ReviewIntervalPolicy intervalPolicy) {
        this.reviewStateMapper = reviewStateMapper;
        this.questionAttemptMapper = questionAttemptMapper;
        this.satQuestionMapper = satQuestionMapper;
        this.intervalPolicy = intervalPolicy;
    }

    public List<ReviewQueueItem> getDueQueue(Long userId, String domain, int requestedLimit) {
        int limit = Math.max(1, Math.min(100, requestedLimit));
        LocalDateTime now = LocalDateTime.now();
        return reviewStateMapper.findDueQueue(userId, normalize(domain), now, limit).stream()
            .map(row -> ReviewQueueItem.from(row, now))
            .toList();
    }

    public ReviewSummary getSummary(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dayStart = LocalDate.now().atStartOfDay();
        ReviewSummary summary = reviewStateMapper.getSummary(userId, now, dayStart, dayStart.plusDays(1));
        if (summary == null) summary = new ReviewSummary();
        if (summary.getDueNow() == null) summary.setDueNow(0L);
        if (summary.getLearning() == null) summary.setLearning(0L);
        if (summary.getMastered() == null) summary.setMastered(0L);
        if (summary.getTotalScheduled() == null) summary.setTotalScheduled(0L);
        if (summary.getRetentionEstimate() == null) summary.setRetentionEstimate(0.0);
        if (summary.getReviewedToday() == null) summary.setReviewedToday(0L);
        return summary;
    }

    public List<ReviewForecastDay> getForecast(Long userId, int requestedDays) {
        int days = Math.max(1, Math.min(30, requestedDays));
        LocalDate firstDay = LocalDate.now();
        LocalDateTime start = firstDay.atStartOfDay();
        LocalDateTime end = start.plusDays(days);
        Map<LocalDate, ReviewForecastBucket> buckets = new HashMap<>();
        for (ReviewForecastBucket bucket : reviewStateMapper.getForecast(userId, start, end)) {
            buckets.put(bucket.getDate(), bucket);
        }

        List<ReviewForecastDay> forecast = new ArrayList<>(days);
        for (int offset = 0; offset < days; offset += 1) {
            LocalDate date = firstDay.plusDays(offset);
            ReviewForecastBucket bucket = buckets.get(date);
            forecast.add(bucket == null
                ? new ReviewForecastDay(date, 0, 0, 0)
                : new ReviewForecastDay(
                    date,
                    value(bucket.getDueCount()),
                    value(bucket.getLearning()),
                    value(bucket.getReview())
                ));
        }
        return forecast;
    }

    @Transactional
    public ReviewScheduleResponse adjust(Long userId, ReviewGradeRequest request) {
        if (satQuestionMapper.selectUsableById(request.getQuestionId()) == null) {
            throw new IllegalArgumentException("This question is not available for review.");
        }

        UserQuestionReviewState state = reviewStateMapper.findForUpdate(userId, request.getQuestionId());
        if (state == null || state.getLastAttemptId() == null) {
            throw new IllegalStateException("Submit an answer before adjusting its review interval.");
        }

        QuestionAttempt attempt = request.getAttemptId() == null
            ? questionAttemptMapper.findLatestForUser(userId, request.getQuestionId())
            : questionAttemptMapper.selectById(request.getAttemptId());
        if (attempt == null
                || !userId.equals(attempt.getUserId())
                || !request.getQuestionId().equals(attempt.getQuestionId())
                || !state.getLastAttemptId().equals(attempt.getId())) {
            throw new IllegalStateException("Only the latest attempt can adjust this schedule.");
        }
        if (attempt.getDefaultStage() == null) {
            throw new IllegalStateException("This attempt does not have a review schedule.");
        }

        LocalDateTime anchor = attempt.getSubmittedAt() == null
            ? state.getLastAnsweredAt()
            : attempt.getSubmittedAt();
        ReviewSchedule schedule = intervalPolicy.adjust(
            attempt.getDefaultStage(), request.getGrade(), anchor);
        int updated = reviewStateMapper.applyGrade(
            userId,
            request.getQuestionId(),
            attempt.getId(),
            schedule.stage(),
            schedule.nextReviewAt(),
            request.getGrade().name()
        );
        if (updated != 1) {
            throw new IllegalStateException("The review schedule changed; refresh and try again.");
        }

        ReviewScheduleResponse response = new ReviewScheduleResponse();
        response.setQuestionId(request.getQuestionId());
        response.setGrade(request.getGrade());
        response.setReviewStage(schedule.stage());
        response.setNextReviewAt(schedule.nextReviewAt());
        response.setIntervalMinutes(schedule.interval().toMinutes());
        response.setStatusLabel(statusLabel(schedule.stage()));
        return response;
    }

    private long value(Long value) {
        return value == null ? 0 : value;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String statusLabel(int stage) {
        if (stage == 0) return "Relearning";
        if (stage <= 2) return "Learning";
        if (stage >= 5) return "Mastered";
        return "Review";
    }
}
