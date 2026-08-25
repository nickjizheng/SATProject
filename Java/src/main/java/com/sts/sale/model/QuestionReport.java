package com.sts.sale.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuestionReport {
    private Long id;
    private Long userId;
    private Integer questionId;
    private String reason;
    private String detail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
