package com.sts.sale.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class MistakeItem {
    private Integer questionId;
    private String domain;
    private String visualsType;
    private String visualsSvgContent;
    private String questionText;
    private String questionParagraph;
    private Map<String, String> choices;
    private String correctAnswer;
    private String explanation;
    private String selectedAnswer;
    private Long responseTimeMs;
    private LocalDateTime occurredAt;
    private MistakeReason reason;
    private Integer confidence;
    private String note;
    private Boolean resolved;
}
