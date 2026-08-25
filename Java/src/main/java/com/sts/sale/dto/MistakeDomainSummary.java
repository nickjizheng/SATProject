package com.sts.sale.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MistakeDomainSummary {
    private String domain;
    private Long count;
}
