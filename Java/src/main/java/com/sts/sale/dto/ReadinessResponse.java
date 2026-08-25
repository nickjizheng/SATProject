package com.sts.sale.dto;

import lombok.Data;

import java.util.List;

@Data
public class ReadinessResponse {
    private EvidenceLevel overallEvidenceLevel;
    private List<DomainReadiness> domains;
    private String methodologyNote;
}
