package com.sts.sale.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuestionReportResponse {
    private Integer questionId;
    private QuestionReportReason reason;
    private String detail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
