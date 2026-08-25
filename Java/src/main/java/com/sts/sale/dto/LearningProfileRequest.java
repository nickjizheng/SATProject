package com.sts.sale.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Data
public class LearningProfileRequest {
    private LocalDate testDate;

    @Min(value = 400, message = "Target score must be between 400 and 1600.")
    @Max(value = 1600, message = "Target score must be between 400 and 1600.")
    private Integer targetScore;

    @Min(value = 400, message = "Baseline score must be between 400 and 1600.")
    @Max(value = 1600, message = "Baseline score must be between 400 and 1600.")
    private Integer baselineScore;

    @NotEmpty(message = "Choose at least one available study day.")
    private List<DayOfWeek> availableDays;

    @NotNull(message = "Daily study minutes are required.")
    @Min(value = 5, message = "Daily study minutes must be between 5 and 180.")
    @Max(value = 180, message = "Daily study minutes must be between 5 and 180.")
    private Integer dailyMinutes;
}
