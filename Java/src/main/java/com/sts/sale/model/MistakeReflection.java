package com.sts.sale.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MistakeReflection {
    private Long id;
    private Long userId;
    private Integer questionId;
    private String reason;
    private Integer confidence;
    private String note;
    private Boolean resolved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
