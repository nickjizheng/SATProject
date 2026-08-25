package com.sts.sale.dto;

import lombok.Data;

import java.time.LocalDateTime;

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

    /** Ebbinghaus-inspired stage assigned to this attempt (signed-in users only). */
    private Integer reviewStage;

    /** When this question should next enter the signed-in user's due queue. */
    private LocalDateTime nextReviewAt;

    /** Length of the assigned interval, useful for concise UI feedback. */
    private Long intervalMinutes;
}
