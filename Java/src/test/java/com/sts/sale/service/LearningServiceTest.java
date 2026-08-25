package com.sts.sale.service;

import com.sts.sale.dto.EvidenceLevel;
import com.sts.sale.dto.LearningProfileRequest;
import com.sts.sale.dto.LearningProfileResponse;
import com.sts.sale.dto.MistakeItem;
import com.sts.sale.dto.MistakeReason;
import com.sts.sale.dto.MistakeReflectionRequest;
import com.sts.sale.dto.QuestionReportReason;
import com.sts.sale.dto.QuestionReportRequest;
import com.sts.sale.dto.QuestionReportResponse;
import com.sts.sale.dto.ReadinessResponse;
import com.sts.sale.mapper.LearningAnalyticsMapper;
import com.sts.sale.mapper.LearningProfileMapper;
import com.sts.sale.model.LearningProfile;
import com.sts.sale.model.MistakeReflection;
import com.sts.sale.model.MistakeRow;
import com.sts.sale.model.QuestionReport;
import com.sts.sale.model.ReadinessAggregateRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LearningServiceTest {

    @Mock
    private LearningProfileMapper profileMapper;
    @Mock
    private LearningAnalyticsMapper analyticsMapper;

    private LearningService service;

    @BeforeEach
    void setUp() {
        service = new LearningService(profileMapper, analyticsMapper);
    }

    @Test
    void absentProfileReturnsUsefulDefaultsWithoutInventingScores() {
        when(profileMapper.findByUserId(7L)).thenReturn(null);

        LearningProfileResponse response = service.getProfile(7L);

        assertNull(response.getTestDate());
        assertNull(response.getTargetScore());
        assertNull(response.getBaselineScore());
        assertEquals(30, response.getDailyMinutes());
        assertEquals(List.of(DayOfWeek.values()), response.getAvailableDays());
    }

    @Test
    void profileUpdateCanonicalizesDaysAndPersistsOnlyAuthenticatedOwner() {
        LearningProfileRequest request = new LearningProfileRequest();
        request.setTestDate(LocalDate.of(2026, 11, 7));
        request.setTargetScore(1450);
        request.setBaselineScore(1180);
        request.setAvailableDays(List.of(
            DayOfWeek.FRIDAY, DayOfWeek.MONDAY, DayOfWeek.FRIDAY));
        request.setDailyMinutes(45);

        LearningProfileResponse response = service.updateProfile(7L, request);

        ArgumentCaptor<LearningProfile> captor = ArgumentCaptor.forClass(LearningProfile.class);
        verify(profileMapper).save(captor.capture());
        assertEquals(7L, captor.getValue().getUserId());
        assertEquals("MONDAY,FRIDAY", captor.getValue().getAvailableDays());
        assertEquals(List.of(DayOfWeek.MONDAY, DayOfWeek.FRIDAY), response.getAvailableDays());
    }

    @Test
    void profileValidationRejectsUnrealisticScoreAndMinutes() {
        LearningProfileRequest request = new LearningProfileRequest();
        request.setTargetScore(399);
        request.setAvailableDays(List.of(DayOfWeek.MONDAY));
        request.setDailyMinutes(4);

        assertThrows(IllegalArgumentException.class,
            () -> service.updateProfile(7L, request));
        verifyNoInteractions(profileMapper);
    }

    @Test
    void readinessReportsEvidenceAndOnlyShowsTrendWithEnoughSamples() {
        ReadinessAggregateRow row = new ReadinessAggregateRow();
        row.setDomain("Advanced Math");
        row.setAttempts(12L);
        row.setCorrectAttempts(9L);
        row.setAccuracyPercent(75.0);
        row.setAverageResponseTimeMs(1234.4);
        row.setRecentAttempts(6L);
        row.setRecentCorrectAttempts(5L);
        row.setPreviousAttempts(5L);
        row.setPreviousCorrectAttempts(2L);

        ReadinessAggregateRow sparse = new ReadinessAggregateRow();
        sparse.setDomain("Information and Ideas");
        sparse.setAttempts(2L);
        sparse.setCorrectAttempts(1L);
        sparse.setAccuracyPercent(50.0);
        sparse.setRecentAttempts(2L);
        sparse.setPreviousAttempts(0L);

        when(analyticsMapper.findReadiness(any(), any(), any()))
            .thenReturn(List.of(row, sparse));

        ReadinessResponse response = service.getReadiness(7L);

        assertEquals(EvidenceLevel.MEDIUM, response.getOverallEvidenceLevel());
        assertEquals(EvidenceLevel.MEDIUM, response.getDomains().get(0).getEvidenceLevel());
        assertEquals(43.3, response.getDomains().get(0).getTrendPercent());
        assertEquals(1234L, response.getDomains().get(0).getAverageResponseTimeMs());
        assertNull(response.getDomains().get(1).getTrendPercent());
        assertTrue(response.getMethodologyNote().contains("not an SAT score prediction"));
    }

    @Test
    void reflectionCanOnlyBeSavedForAnOwnedCurrentIncorrectAttempt() {
        MistakeReflectionRequest request = reflectionRequest();
        when(analyticsMapper.countCurrentIncorrectAttempts(7L, 42)).thenReturn(0L);

        assertThrows(LearningService.ResourceNotFoundException.class,
            () -> service.updateMistake(7L, 42, request));

        verify(analyticsMapper, never()).saveReflection(any());
    }

    @Test
    void reflectionUpsertReturnsTheLatestIncorrectAttemptWithCurrentAnswerKey() {
        MistakeReflectionRequest request = reflectionRequest();
        request.setNote("  I skipped a condition.  ");
        when(analyticsMapper.countCurrentIncorrectAttempts(7L, 42)).thenReturn(2L);

        MistakeRow row = new MistakeRow();
        row.setQuestionId(42);
        row.setQuestionText("Which value satisfies the equation?");
        row.setChoiceA("1");
        row.setChoiceB("2");
        row.setChoiceC("3");
        row.setChoiceD("4");
        row.setCorrectAnswer("C");
        row.setSelectedAnswer("B");
        row.setReason("MISREAD");
        row.setConfidence(3);
        row.setResolved(false);
        when(analyticsMapper.findMistake(7L, 42)).thenReturn(row);

        MistakeItem item = service.updateMistake(7L, 42, request);

        ArgumentCaptor<MistakeReflection> captor =
            ArgumentCaptor.forClass(MistakeReflection.class);
        verify(analyticsMapper).saveReflection(captor.capture());
        assertEquals(7L, captor.getValue().getUserId());
        assertEquals("I skipped a condition.", captor.getValue().getNote());
        assertEquals(MistakeReason.MISREAD, item.getReason());
        assertEquals("3", item.getChoices().get("C"));
    }

    @Test
    void questionReportIsOwnerScopedAndIdempotentlyReadAfterUpsert() {
        QuestionReportRequest request = new QuestionReportRequest();
        request.setReason(QuestionReportReason.WRONG_KEY);
        request.setDetail("  The explanation supports a different option.  ");
        when(analyticsMapper.countQuestion(42)).thenReturn(1L);

        QuestionReport stored = new QuestionReport();
        stored.setUserId(7L);
        stored.setQuestionId(42);
        stored.setReason("WRONG_KEY");
        stored.setDetail("The explanation supports a different option.");
        stored.setCreatedAt(LocalDateTime.of(2026, 8, 25, 10, 0));
        stored.setUpdatedAt(LocalDateTime.of(2026, 8, 25, 10, 5));
        when(analyticsMapper.findQuestionReport(7L, 42, "WRONG_KEY"))
            .thenReturn(stored);

        QuestionReportResponse response = service.reportQuestion(7L, 42, request);

        ArgumentCaptor<QuestionReport> captor = ArgumentCaptor.forClass(QuestionReport.class);
        verify(analyticsMapper).saveQuestionReport(captor.capture());
        assertEquals(7L, captor.getValue().getUserId());
        assertEquals("The explanation supports a different option.", captor.getValue().getDetail());
        assertEquals(QuestionReportReason.WRONG_KEY, response.getReason());
    }

    private MistakeReflectionRequest reflectionRequest() {
        MistakeReflectionRequest request = new MistakeReflectionRequest();
        request.setReason(MistakeReason.MISREAD);
        request.setConfidence(3);
        request.setResolved(false);
        return request;
    }
}
