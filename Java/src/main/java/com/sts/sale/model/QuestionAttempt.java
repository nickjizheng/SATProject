package com.sts.sale.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("question_attempts")
public class QuestionAttempt {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String submissionId;
    private Long userId;
    private String sessionId;
    private Integer questionId;
    private String userAnswer;
    private Boolean isCorrect;
    private String studyMode;
    private Long responseTimeMs;
    private Integer stageBefore;
    private Integer defaultStage;
    private LocalDateTime defaultNextReviewAt;
    private LocalDateTime submittedAt;
}
