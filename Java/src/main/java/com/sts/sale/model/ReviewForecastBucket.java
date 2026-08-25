package com.sts.sale.model;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ReviewForecastBucket {
    private LocalDate date;
    private Long dueCount;
    private Long learning;
    private Long review;
}
