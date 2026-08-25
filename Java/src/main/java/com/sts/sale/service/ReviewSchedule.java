package com.sts.sale.service;

import java.time.Duration;
import java.time.LocalDateTime;

public record ReviewSchedule(int stage, LocalDateTime nextReviewAt, Duration interval) {
}
