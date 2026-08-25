package com.sts.sale.service;

import com.sts.sale.dto.DomainReadiness;
import com.sts.sale.dto.EvidenceLevel;
import com.sts.sale.dto.LearningProfileRequest;
import com.sts.sale.dto.LearningProfileResponse;
import com.sts.sale.dto.MistakeItem;
import com.sts.sale.dto.MistakeDomainSummary;
import com.sts.sale.dto.MistakeReason;
import com.sts.sale.dto.MistakeReasonSummary;
import com.sts.sale.dto.MistakeReflectionRequest;
import com.sts.sale.dto.MistakeSummary;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class LearningService {

    private static final int DEFAULT_DAILY_MINUTES = 30;
    private static final int MIN_TREND_SAMPLE = 5;
    private static final int MAX_MISTAKE_LIMIT = 100;
    private static final String METHODOLOGY_NOTE =
        "Practice readiness uses only your attempts against questions that currently pass the quality screen. "
            + "It is not an SAT score prediction.";

    private final LearningProfileMapper profileMapper;
    private final LearningAnalyticsMapper analyticsMapper;

    public LearningService(LearningProfileMapper profileMapper,
                           LearningAnalyticsMapper analyticsMapper) {
        this.profileMapper = profileMapper;
        this.analyticsMapper = analyticsMapper;
    }

    public LearningProfileResponse getProfile(Long userId) {
        LearningProfile profile = profileMapper.findByUserId(userId);
        if (profile == null) {
            LearningProfileResponse defaults = new LearningProfileResponse();
            defaults.setAvailableDays(allDays());
            defaults.setDailyMinutes(DEFAULT_DAILY_MINUTES);
            return defaults;
        }
        return toProfileResponse(profile);
    }

    @Transactional
    public LearningProfileResponse updateProfile(Long userId, LearningProfileRequest request) {
        validateProfile(request);
        List<DayOfWeek> availableDays = canonicalDays(request.getAvailableDays());

        LearningProfile profile = new LearningProfile();
        profile.setUserId(userId);
        profile.setTestDate(request.getTestDate());
        profile.setTargetScore(request.getTargetScore());
        profile.setBaselineScore(request.getBaselineScore());
        profile.setAvailableDays(joinDays(availableDays));
        profile.setDailyMinutes(request.getDailyMinutes());
        profileMapper.save(profile);

        return toProfileResponse(profile);
    }

    public ReadinessResponse getReadiness(Long userId) {
        LocalDateTime recentStart = LocalDateTime.now().minusDays(14);
        LocalDateTime previousStart = recentStart.minusDays(14);
        List<ReadinessAggregateRow> rows = analyticsMapper.findReadiness(
            userId, recentStart, previousStart);

        long totalAttempts = 0;
        List<DomainReadiness> domains = new ArrayList<>();
        for (ReadinessAggregateRow row : rows) {
            long attempts = value(row.getAttempts());
            long correctAttempts = value(row.getCorrectAttempts());
            totalAttempts += attempts;

            DomainReadiness readiness = new DomainReadiness();
            readiness.setDomain(row.getDomain());
            readiness.setAttempts(attempts);
            readiness.setCorrectAttempts(correctAttempts);
            readiness.setAccuracyPercent(row.getAccuracyPercent() == null
                ? 0.0 : roundOneDecimal(row.getAccuracyPercent()));
            readiness.setAverageResponseTimeMs(row.getAverageResponseTimeMs() == null
                ? null : Math.round(row.getAverageResponseTimeMs()));
            readiness.setEvidenceLevel(evidenceLevel(attempts));
            readiness.setTrendPercent(calculateTrend(row));
            domains.add(readiness);
        }

        ReadinessResponse response = new ReadinessResponse();
        response.setOverallEvidenceLevel(evidenceLevel(totalAttempts));
        response.setDomains(domains);
        response.setMethodologyNote(METHODOLOGY_NOTE);
        return response;
    }

    public List<MistakeItem> getMistakes(Long userId,
                                         String reason,
                                         String domain,
                                         String resolved,
                                         int requestedLimit) {
        MistakeReason parsedReason = parseMistakeReason(reason);
        Boolean parsedResolved = parseBooleanFilter(resolved);
        int limit = Math.max(1, Math.min(MAX_MISTAKE_LIMIT, requestedLimit));
        return analyticsMapper.findMistakes(
                userId,
                parsedReason == null ? null : parsedReason.name(),
                normalize(domain),
                parsedResolved,
                limit
            ).stream()
            .map(this::toMistakeItem)
            .toList();
    }

    @Transactional
    public MistakeItem updateMistake(Long userId,
                                     Integer questionId,
                                     MistakeReflectionRequest request) {
        if (questionId == null || questionId <= 0) {
            throw new IllegalArgumentException("A valid question ID is required.");
        }
        validateReflection(request);
        if (analyticsMapper.countCurrentIncorrectAttempts(userId, questionId) == 0) {
            throw new ResourceNotFoundException(
                "No current incorrect attempt was found for this question.");
        }

        MistakeReflection reflection = new MistakeReflection();
        reflection.setUserId(userId);
        reflection.setQuestionId(questionId);
        reflection.setReason(request.getReason().name());
        reflection.setConfidence(request.getConfidence());
        reflection.setNote(normalize(request.getNote()));
        reflection.setResolved(request.getResolved());
        analyticsMapper.saveReflection(reflection);

        MistakeRow updated = analyticsMapper.findMistake(userId, questionId);
        if (updated == null) {
            throw new ResourceNotFoundException(
                "This mistake is no longer available under the current quality screen.");
        }
        return toMistakeItem(updated);
    }

    public MistakeSummary getMistakeSummary(Long userId) {
        MistakeSummary summary = new MistakeSummary();
        summary.setUnresolvedTotal(analyticsMapper.countUnresolvedMistakes(userId));
        summary.setByReason(analyticsMapper.summarizeUnresolvedByReason(userId).stream()
            .map(group -> new MistakeReasonSummary(
                safeMistakeReason(group.getLabel()), group.getCount()))
            .toList());
        summary.setByDomain(analyticsMapper.summarizeUnresolvedByDomain(userId).stream()
            .map(group -> new MistakeDomainSummary(group.getLabel(), group.getCount()))
            .toList());
        return summary;
    }

    @Transactional
    public QuestionReportResponse reportQuestion(Long userId,
                                                 Integer questionId,
                                                 QuestionReportRequest request) {
        requireExistingQuestion(questionId);
        validateQuestionReport(request);

        QuestionReport report = new QuestionReport();
        report.setUserId(userId);
        report.setQuestionId(questionId);
        report.setReason(request.getReason().name());
        report.setDetail(normalize(request.getDetail()));
        analyticsMapper.saveQuestionReport(report);

        QuestionReport stored = analyticsMapper.findQuestionReport(
            userId, questionId, request.getReason().name());
        if (stored == null) {
            throw new IllegalStateException("The question report could not be read after saving.");
        }
        return toQuestionReportResponse(stored);
    }

    public List<QuestionReportResponse> getQuestionReports(Long userId, Integer questionId) {
        requireExistingQuestion(questionId);
        return analyticsMapper.findQuestionReports(userId, questionId).stream()
            .map(this::toQuestionReportResponse)
            .toList();
    }

    private void requireExistingQuestion(Integer questionId) {
        if (questionId == null || questionId <= 0
                || analyticsMapper.countQuestion(questionId) == 0) {
            throw new ResourceNotFoundException("Question not found.");
        }
    }

    private LearningProfileResponse toProfileResponse(LearningProfile profile) {
        LearningProfileResponse response = new LearningProfileResponse();
        response.setTestDate(profile.getTestDate());
        response.setTargetScore(profile.getTargetScore());
        response.setBaselineScore(profile.getBaselineScore());
        response.setAvailableDays(parseDays(profile.getAvailableDays()));
        response.setDailyMinutes(profile.getDailyMinutes() == null
            ? DEFAULT_DAILY_MINUTES : profile.getDailyMinutes());
        return response;
    }

    private MistakeItem toMistakeItem(MistakeRow row) {
        MistakeItem item = new MistakeItem();
        item.setQuestionId(row.getQuestionId());
        item.setDomain(row.getDomain());
        item.setVisualsType(row.getVisualsType());
        item.setVisualsSvgContent(row.getVisualsSvgContent());
        item.setQuestionText(row.getQuestionText());
        item.setQuestionParagraph(row.getQuestionParagraph());
        Map<String, String> choices = new LinkedHashMap<>();
        choices.put("A", row.getChoiceA());
        choices.put("B", row.getChoiceB());
        choices.put("C", row.getChoiceC());
        choices.put("D", row.getChoiceD());
        item.setChoices(choices);
        item.setCorrectAnswer(row.getCorrectAnswer());
        item.setExplanation(row.getExplanation());
        item.setSelectedAnswer(row.getSelectedAnswer());
        item.setResponseTimeMs(row.getResponseTimeMs());
        item.setOccurredAt(row.getOccurredAt());
        item.setReason(safeMistakeReason(row.getReason()));
        item.setConfidence(row.getConfidence());
        item.setNote(row.getNote());
        item.setResolved(Boolean.TRUE.equals(row.getResolved()));
        return item;
    }

    private QuestionReportResponse toQuestionReportResponse(QuestionReport report) {
        QuestionReportResponse response = new QuestionReportResponse();
        response.setQuestionId(report.getQuestionId());
        response.setReason(QuestionReportReason.valueOf(report.getReason()));
        response.setDetail(report.getDetail());
        response.setCreatedAt(report.getCreatedAt());
        response.setUpdatedAt(report.getUpdatedAt());
        return response;
    }

    private Double calculateTrend(ReadinessAggregateRow row) {
        long recentAttempts = value(row.getRecentAttempts());
        long previousAttempts = value(row.getPreviousAttempts());
        if (recentAttempts < MIN_TREND_SAMPLE || previousAttempts < MIN_TREND_SAMPLE) {
            return null;
        }
        double recentAccuracy = 100.0 * value(row.getRecentCorrectAttempts()) / recentAttempts;
        double previousAccuracy = 100.0 * value(row.getPreviousCorrectAttempts()) / previousAttempts;
        return roundOneDecimal(recentAccuracy - previousAccuracy);
    }

    private EvidenceLevel evidenceLevel(long attempts) {
        if (attempts < 10) return EvidenceLevel.LOW;
        if (attempts < 30) return EvidenceLevel.MEDIUM;
        return EvidenceLevel.HIGH;
    }

    private void validateProfile(LearningProfileRequest request) {
        if (request == null) throw new IllegalArgumentException("A study profile is required.");
        validateScore(request.getTargetScore(), "Target score");
        validateScore(request.getBaselineScore(), "Baseline score");
        if (request.getAvailableDays() == null || request.getAvailableDays().isEmpty()
                || request.getAvailableDays().stream().anyMatch(day -> day == null)) {
            throw new IllegalArgumentException("Choose at least one available study day.");
        }
        if (request.getDailyMinutes() == null
                || request.getDailyMinutes() < 5
                || request.getDailyMinutes() > 180) {
            throw new IllegalArgumentException("Daily study minutes must be between 5 and 180.");
        }
    }

    private void validateScore(Integer score, String label) {
        if (score != null && (score < 400 || score > 1600)) {
            throw new IllegalArgumentException(label + " must be between 400 and 1600.");
        }
    }

    private void validateReflection(MistakeReflectionRequest request) {
        if (request == null || request.getReason() == null) {
            throw new IllegalArgumentException("A mistake reason is required.");
        }
        if (request.getConfidence() != null
                && (request.getConfidence() < 1 || request.getConfidence() > 5)) {
            throw new IllegalArgumentException("Confidence must be between 1 and 5.");
        }
        if (request.getNote() != null && request.getNote().length() > 1000) {
            throw new IllegalArgumentException("The reflection note cannot exceed 1000 characters.");
        }
        if (request.getResolved() == null) {
            throw new IllegalArgumentException("Resolved status is required.");
        }
    }

    private void validateQuestionReport(QuestionReportRequest request) {
        if (request == null || request.getReason() == null) {
            throw new IllegalArgumentException("A report reason is required.");
        }
        if (request.getDetail() != null && request.getDetail().length() > 1000) {
            throw new IllegalArgumentException("Report detail cannot exceed 1000 characters.");
        }
    }

    private MistakeReason parseMistakeReason(String value) {
        String normalized = normalize(value);
        if (normalized == null) return null;
        try {
            return MistakeReason.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unknown mistake reason.");
        }
    }

    private MistakeReason safeMistakeReason(String value) {
        try {
            return MistakeReason.valueOf(value == null ? "UNCLASSIFIED" : value);
        } catch (IllegalArgumentException exception) {
            return MistakeReason.UNCLASSIFIED;
        }
    }

    private Boolean parseBooleanFilter(String value) {
        String normalized = normalize(value);
        if (normalized == null) return null;
        if (normalized.equalsIgnoreCase("true")) return true;
        if (normalized.equalsIgnoreCase("false")) return false;
        throw new IllegalArgumentException("Resolved must be true or false.");
    }

    private List<DayOfWeek> canonicalDays(List<DayOfWeek> days) {
        return new ArrayList<>(EnumSet.copyOf(days));
    }

    private List<DayOfWeek> allDays() {
        return List.copyOf(Arrays.asList(DayOfWeek.values()));
    }

    private String joinDays(List<DayOfWeek> days) {
        return String.join(",", days.stream().map(Enum::name).toList());
    }

    private List<DayOfWeek> parseDays(String storedDays) {
        String normalized = normalize(storedDays);
        if (normalized == null) return allDays();
        try {
            List<DayOfWeek> parsed = Arrays.stream(normalized.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(DayOfWeek::valueOf)
                .toList();
            return parsed.isEmpty() ? allDays() : canonicalDays(parsed);
        } catch (IllegalArgumentException exception) {
            return allDays();
        }
    }

    private long value(Long value) {
        return value == null ? 0 : value;
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }
}
