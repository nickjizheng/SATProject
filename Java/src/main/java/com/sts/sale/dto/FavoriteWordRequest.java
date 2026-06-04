package com.sts.sale.dto;

import lombok.Data;

@Data
public class FavoriteWordRequest {
    private String word;
    private String wordData; // JSON格式的完整单词数据
}
