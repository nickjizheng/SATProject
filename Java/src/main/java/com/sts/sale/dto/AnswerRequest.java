package com.sts.sale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 答题请求DTO
 */
@Data
public class AnswerRequest {
    
    @NotNull(message = "题目ID不能为空")
    private Integer questionId;
    
    @NotBlank(message = "答案不能为空")
    private String answer; // A, B, C, D
    
    @Size(max = 100, message = "会话ID过长")
    private String sessionId; // 会话ID

    @Size(max = 100, message = "提交ID过长")
    private String submissionId;

    @Size(max = 40, message = "学习模式过长")
    private String studyMode;

    @PositiveOrZero(message = "答题时间不能为负数")
    private Long responseTimeMs;
}
