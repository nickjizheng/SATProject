package com.sts.sale.model;

import lombok.Data;

@Data
public class ReadinessAggregateRow {
    private String domain;
    private Long attempts;
    private Long correctAttempts;
    private Double accuracyPercent;
    private Double averageResponseTimeMs;
    private Long recentAttempts;
    private Long recentCorrectAttempts;
    private Long previousAttempts;
    private Long previousCorrectAttempts;
}
