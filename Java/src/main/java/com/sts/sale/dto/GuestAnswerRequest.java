package com.sts.sale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** The deliberately minimal payload accepted by stateless guest scoring. */
@Data
public class GuestAnswerRequest {

    @NotNull(message = "Question ID is required.")
    private Integer questionId;

    @NotBlank(message = "Answer is required.")
    private String answer;
}
