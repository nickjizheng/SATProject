package com.sts.sale.model;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_question_review_state")
public class UserQuestionReviewState {
    private Long userId;
    private Integer questionId;
    private Integer stage;
    private LocalDateTime nextReviewAt;
    private LocalDateTime lastAnsweredAt;
    private Boolean lastCorrect;
    private Integer correctStreak;
    private Integer lapseCount;
    private Integer totalAttempts;
    private Long lastAttemptId;
    private String lastGrade;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
