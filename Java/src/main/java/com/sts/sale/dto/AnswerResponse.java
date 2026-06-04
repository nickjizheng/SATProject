package com.sts.sale.dto;

import lombok.Data;

/**
 * 答题响应DTO
 */
@Data
public class AnswerResponse {
    
    /**
     * 是否正确
     */
    private Boolean isCorrect;
    
    /**
     * 正确答案
     */
    private String correctAnswer;
    
    /**
     * 用户答案
     */
    private String userAnswer;
    
    /**
     * 题目解释
     */
    private String explanation;
    
    /**
     * 题目ID
     */
    private Integer questionId;
}
