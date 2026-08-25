package com.sts.sale.dto;

import lombok.Data;

import java.util.List;

@Data
public class MistakeSummary {
    private Long unresolvedTotal;
    private List<MistakeReasonSummary> byReason;
    private List<MistakeDomainSummary> byDomain;
}
