package com.sts.sale.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MistakeReasonSummary {
    private MistakeReason reason;
    private Long count;
}
