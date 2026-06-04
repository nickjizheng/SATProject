package com.sts.sale.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FavoriteQuestionResponse {
    private Long id;
    private Long questionId;
    private String questionData;
    private String questionText; // 提取的题目文本
    private String domain; // 题目领域
    private String difficulty; // 难度等级
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
