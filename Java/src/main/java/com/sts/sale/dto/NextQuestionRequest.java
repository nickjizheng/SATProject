package com.sts.sale.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 获取下一题请求DTO
 */
@Data
public class NextQuestionRequest {
    
    @NotBlank(message = "会话ID不能为空")
    private String sessionId;
    
    /**
     * 题目领域（可选）
     */
    private String domain;
}
