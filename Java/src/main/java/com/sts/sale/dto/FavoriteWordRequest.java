package com.sts.sale.dto;

import lombok.Data;

@Data
public class FavoriteWordRequest {
    private String word;
    private String wordData; // JSON格式的完整单词数据

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
}
