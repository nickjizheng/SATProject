package com.sts.sale.dto;

import com.sts.sale.model.ReviewQueueRow;
import lombok.Data;

import java.time.Duration;
import java.time.LocalDateTime;

@Data
public class ReviewQueueItem {
    private SatQuestionResponse question;
    private Integer stage;
    private LocalDateTime dueAt;
    private Long intervalMinutes;
    private Integer reviewCount;
    private Integer lapseCount;
    private Long overdueMinutes;
    private String statusLabel;

    public static ReviewQueueItem from(ReviewQueueRow row, LocalDateTime now) {
        ReviewQueueItem item = new ReviewQueueItem();
        item.setQuestion(SatQuestionResponse.fromSatQuestion(row.toSatQuestion()));
        item.setStage(row.getReviewStage());
        item.setDueAt(row.getNextReviewAt());
        item.setIntervalMinutes(Math.max(0, Duration.between(
            row.getLastAnsweredAt(), row.getNextReviewAt()).toMinutes()));
        item.setReviewCount(row.getTotalAttempts());
        item.setLapseCount(row.getLapseCount());
        item.setOverdueMinutes(Math.max(0, Duration.between(row.getNextReviewAt(), now).toMinutes()));
        item.setStatusLabel(statusLabel(row.getReviewStage()));
        return item;
    }

    private static String statusLabel(int stage) {
        if (stage == 0) return "Relearning";
        if (stage <= 2) return "Learning";
        if (stage >= 5) return "Mastered";
        return "Review";
    }
}
