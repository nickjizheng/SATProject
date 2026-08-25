package com.sts.sale.dto;

import com.sts.sale.model.ReviewGrade;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewGradeRequest {
    @NotNull(message = "Question ID is required.")
    private Integer questionId;

    @NotNull(message = "Review grade is required.")
    private ReviewGrade grade;

    private Long attemptId;
}
