package com.sts.sale.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LearningRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void profileBoundsAndStudyDaysAreBeanValidated() {
        LearningProfileRequest request = new LearningProfileRequest();
        request.setTargetScore(1700);
        request.setAvailableDays(List.of());
        request.setDailyMinutes(4);

        assertEquals(3, validator.validate(request).size());
    }

    @Test
    void reflectionReasonConfidenceNoteAndResolvedAreValidated() {
        MistakeReflectionRequest request = new MistakeReflectionRequest();
        request.setConfidence(0);
        request.setNote("x".repeat(1001));

        assertEquals(4, validator.validate(request).size());
    }

    @Test
    void reportRequiresAllowlistedReasonAndBoundedDetail() {
        QuestionReportRequest request = new QuestionReportRequest();
        request.setDetail("x".repeat(1001));

        assertEquals(2, validator.validate(request).size());
    }
}
