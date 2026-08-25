package com.sts.sale.dto;

import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Data
public class LearningProfileResponse {
    private LocalDate testDate;
    private Integer targetScore;
    private Integer baselineScore;
    private List<DayOfWeek> availableDays;
    private Integer dailyMinutes;
}
