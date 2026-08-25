package com.sts.sale.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MistakeRow {
    private Integer questionId;
    private String domain;
    private String visualsType;
    private String visualsSvgContent;
    private String questionText;
    private String questionParagraph;
    private String choiceA;
    private String choiceB;
    private String choiceC;
    private String choiceD;
    private String correctAnswer;
    private String explanation;
    private String selectedAnswer;
    private Long responseTimeMs;
    private LocalDateTime occurredAt;
    private String reason;
    private Integer confidence;
    private String note;
    private Boolean resolved;
}
