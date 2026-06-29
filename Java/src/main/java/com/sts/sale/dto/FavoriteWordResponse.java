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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getWordData() {
        return wordData;
    }

    public void setWordData(String wordData) {
        this.wordData = wordData;
    }

    public String getShortDefinition() {
        return shortDefinition;
    }

    public void setShortDefinition(String shortDefinition) {
        this.shortDefinition = shortDefinition;
    }

    public String getPartOfSpeech() {
        return partOfSpeech;
    }

    public void setPartOfSpeech(String partOfSpeech) {
        this.partOfSpeech = partOfSpeech;
    }

    public String getPronunciation() {
        return pronunciation;
    }

    public void setPronunciation(String pronunciation) {
        this.pronunciation = pronunciation;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
