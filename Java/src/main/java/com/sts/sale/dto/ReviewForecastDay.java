package com.sts.sale.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ReviewForecastDay {
    private LocalDate date;
    private long dueCount;
    private long learning;
    private long review;
}
