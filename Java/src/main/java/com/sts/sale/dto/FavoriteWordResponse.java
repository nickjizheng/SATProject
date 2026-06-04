package com.sts.sale.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FavoriteWordResponse {
    private Long id;
    private String word;
    private String wordData;
    private String shortDefinition; // 提取的简短定义
    private String partOfSpeech; // 词性
    private String pronunciation; // 发音
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
