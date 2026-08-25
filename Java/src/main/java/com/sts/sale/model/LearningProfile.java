package com.sts.sale.model;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LearningProfile {
    private Long userId;
    private LocalDate testDate;
    private Integer targetScore;
    private Integer baselineScore;
    private String availableDays;
    private Integer dailyMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
