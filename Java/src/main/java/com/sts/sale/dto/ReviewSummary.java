package com.sts.sale.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewSummary {
    private Long dueNow;
    private Long learning;
    private Long mastered;
    private Long totalScheduled;
    private Double retentionEstimate;
    private LocalDateTime nextDueAt;
    private Long reviewedToday;
}
