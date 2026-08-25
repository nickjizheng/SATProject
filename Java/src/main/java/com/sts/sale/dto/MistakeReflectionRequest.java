package com.sts.sale.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MistakeReflectionRequest {
    @NotNull(message = "A mistake reason is required.")
    private MistakeReason reason;

    @Min(value = 1, message = "Confidence must be between 1 and 5.")
    @Max(value = 5, message = "Confidence must be between 1 and 5.")
    private Integer confidence;

    @Size(max = 1000, message = "The reflection note cannot exceed 1000 characters.")
    private String note;

    @NotNull(message = "Resolved status is required.")
    private Boolean resolved;
}
