package com.sts.sale.dto;

import lombok.Data;

@Data
public class DomainReadiness {
    private String domain;
    private Long attempts;
    private Long correctAttempts;
    private Double accuracyPercent;
    private Long averageResponseTimeMs;
    private EvidenceLevel evidenceLevel;
    private Double trendPercent;
}
