package com.sts.sale.dto;

import com.sts.sale.model.ReviewGrade;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewScheduleResponse {
    private Integer questionId;
    private ReviewGrade grade;
    private Integer reviewStage;
    private LocalDateTime nextReviewAt;
    private Long intervalMinutes;
    private String statusLabel;
}
