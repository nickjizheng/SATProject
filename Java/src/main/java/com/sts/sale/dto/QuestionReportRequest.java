package com.sts.sale.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QuestionReportRequest {
    @NotNull(message = "A report reason is required.")
    private QuestionReportReason reason;

    @Size(max = 1000, message = "Report detail cannot exceed 1000 characters.")
    private String detail;
}
