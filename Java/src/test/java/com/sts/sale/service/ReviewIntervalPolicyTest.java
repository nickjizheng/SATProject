package com.sts.sale.service;

import com.sts.sale.model.ReviewGrade;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReviewIntervalPolicyTest {

    private static final LocalDateTime ANCHOR = LocalDateTime.of(2026, 8, 25, 9, 30);
    private final ReviewIntervalPolicy policy = new ReviewIntervalPolicy();

    @Test
    void incorrectAnswersEnterTheTenMinuteRelearningStage() {
        ReviewSchedule schedule = policy.defaultSchedule(5, false, ANCHOR);

        assertSchedule(schedule, 0, Duration.ofMinutes(10));
    }

    @Test
    void correctAnswersAdvanceThroughTheSuccessLadderAndCapAtSixtyDays() {
        assertSchedule(policy.defaultSchedule(null, true, ANCHOR), 1, Duration.ofDays(1));
        assertSchedule(policy.defaultSchedule(1, true, ANCHOR), 2, Duration.ofDays(3));
        assertSchedule(policy.defaultSchedule(6, true, ANCHOR), 6, Duration.ofDays(60));
    }

    @Test
    void selfRatingAdjustsRelativeToTheDefaultSchedule() {
        assertSchedule(policy.adjust(4, ReviewGrade.AGAIN, ANCHOR), 0, Duration.ofMinutes(10));
        assertSchedule(policy.adjust(4, ReviewGrade.HARD, ANCHOR), 3, Duration.ofDays(7));
        assertSchedule(policy.adjust(4, ReviewGrade.GOOD, ANCHOR), 4, Duration.ofDays(14));
        assertSchedule(policy.adjust(4, ReviewGrade.EASY, ANCHOR), 5, Duration.ofDays(30));
    }

    private void assertSchedule(ReviewSchedule schedule, int stage, Duration interval) {
        assertEquals(stage, schedule.stage());
        assertEquals(interval, schedule.interval());
        assertEquals(ANCHOR.plus(interval), schedule.nextReviewAt());
    }
}
