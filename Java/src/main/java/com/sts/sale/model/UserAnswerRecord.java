package com.sts.sale.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户答题记录模型
 */
@Data
@TableName("user_answer_records")
public class UserAnswerRecord {
    
    @TableId(type = IdType.AUTO)
    private Integer id;
    
    /**
     * 用户ID（暂时可以为空，后续集成用户系统）
     */
    private Integer userId;
    
    /**
     * 题目ID
     */
    private Integer questionId;
    
    /**
     * 用户答案
     */
    private String userAnswer;
    
    /**
     * 是否正确
     */
    private Boolean isCorrect;
    
    /**
     * 答题时间
     */
    private LocalDateTime answeredAt;
    
    /**
     * 会话ID（用于临时用户）
     */
    private String sessionId;
}
