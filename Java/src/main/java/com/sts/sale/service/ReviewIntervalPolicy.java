package com.sts.sale.service;

import com.sts.sale.model.ReviewGrade;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * A small deterministic Ebbinghaus-inspired ladder. Stage zero is the lapse
 * interval; stages one through six are the expanding successful-review intervals.
 */
@Component
public class ReviewIntervalPolicy {

    public static final int MAX_STAGE = 6;
    private static final Duration LAPSE_INTERVAL = Duration.ofMinutes(10);
    private static final List<Duration> SUCCESS_INTERVALS = List.of(
        Duration.ofDays(1),
        Duration.ofDays(3),
        Duration.ofDays(7),
        Duration.ofDays(14),
        Duration.ofDays(30),
        Duration.ofDays(60)
    );

    public ReviewSchedule defaultSchedule(Integer currentStage, boolean correct, LocalDateTime anchor) {
        if (!correct) {
            return scheduleForStage(0, anchor);
        }

        int nextStage = currentStage == null || currentStage < 1
            ? 1
            : Math.min(MAX_STAGE, currentStage + 1);
        return scheduleForStage(nextStage, anchor);
    }

    public ReviewSchedule adjust(int defaultStage, ReviewGrade grade, LocalDateTime anchor) {
        int targetStage = switch (grade) {
            case AGAIN -> 0;
            case HARD -> Math.max(0, defaultStage - 1);
            case GOOD -> clampStage(defaultStage);
            case EASY -> Math.min(MAX_STAGE, defaultStage + 1);
        };
        return scheduleForStage(targetStage, anchor);
    }

    public ReviewSchedule scheduleForStage(int stage, LocalDateTime anchor) {
        int validStage = clampStage(stage);
        Duration interval = validStage == 0
            ? LAPSE_INTERVAL
            : SUCCESS_INTERVALS.get(validStage - 1);
        return new ReviewSchedule(validStage, anchor.plus(interval), interval);
    }

    private int clampStage(int stage) {
        return Math.max(0, Math.min(MAX_STAGE, stage));
    }
}
