package com.sts.sale.dto;

import lombok.Data;

/**
 * 获取下一题响应DTO
 */
@Data
public class NextQuestionResponse {
    
    /**
     * 题目信息
     */
    private SatQuestionResponse question;
    
    /**
     * 是否还有未做过的题目
     */
    private Boolean hasMoreQuestions;
    
    /**
     * 当前会话已做题目数量
     */
    private Integer answeredCount;
    
    /**
     * 当前会话总题目数量
     */
    private Integer totalCount;
}
