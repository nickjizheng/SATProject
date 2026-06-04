package com.sts.sale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    
    @NotBlank(message = "会话ID不能为空")
    private String sessionId; // 会话ID
}
