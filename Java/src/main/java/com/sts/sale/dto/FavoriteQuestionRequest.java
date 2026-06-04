package com.sts.sale.dto;

import lombok.Data;

@Data
public class FavoriteQuestionRequest {
    private Long questionId;
    private String questionData; // JSON格式的完整题目数据
}
