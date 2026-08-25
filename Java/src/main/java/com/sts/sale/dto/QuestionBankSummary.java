package com.sts.sale.dto;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class QuestionBankSummary {
    private long totalQuestions;
    private long usableQuestions;
    private long quarantinedQuestions;
    private long duplicateQuestions;
    private Map<String, Long> byDomain = new LinkedHashMap<>();
    private Map<String, Long> byQualityStatus = new LinkedHashMap<>();
}
