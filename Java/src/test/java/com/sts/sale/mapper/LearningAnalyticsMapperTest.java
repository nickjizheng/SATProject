package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import org.apache.ibatis.mapping.MappedStatement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LearningAnalyticsMapperTest {

    private MybatisConfiguration configuration;

    @BeforeEach
    void registerMappers() {
        configuration = new MybatisConfiguration();
        configuration.addMapper(LearningAnalyticsMapper.class);
        configuration.addMapper(LearningProfileMapper.class);
    }

    @Test
    void readinessIsOwnerScopedQualityGatedAndRecomputesCurrentCorrectness() {
        String sql = sqlFor(LearningAnalyticsMapper.class, "findReadiness", Map.of(
            "userId", 7L,
            "recentStart", LocalDateTime.of(2026, 8, 11, 10, 0),
            "previousStart", LocalDateTime.of(2026, 7, 28, 10, 0)
        ));

        assertTrue(sql.contains("quality.usable = 1"));
        assertTrue(sql.contains("attempt.user_id = ?"));
        assertTrue(sql.contains("UPPER(TRIM(attempt.user_answer)) = UPPER(TRIM(sq.correct_answer))"));
        assertTrue(sql.contains("attempt.submitted_at < ?"));
        assertFalse(sql.contains("attempt.is_correct"));
    }

    @Test
    void mistakeQueryUsesLatestCurrentIncorrectAttemptAndAllOptionalFilters() {
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("userId", 7L);
        parameters.put("reason", "MISREAD");
        parameters.put("domain", "Advanced Math");
        parameters.put("resolved", false);
        parameters.put("limit", 20);

        String sql = sqlFor(
            LearningAnalyticsMapper.class, "findMistakes", parameters);

        assertTrue(sql.contains("attempt.user_id = ?"));
        assertTrue(sql.contains("quality.usable = 1"));
        assertTrue(sql.contains("UPPER(TRIM(attempt.user_answer)) != UPPER(TRIM(sq.correct_answer))"));
        assertTrue(sql.contains("NOT EXISTS"));
        assertTrue(sql.contains("COALESCE(reflection.reason, 'UNCLASSIFIED') = ?"));
        assertTrue(sql.contains("TRIM(sq.domain) = ?"));
        assertTrue(sql.contains("COALESCE(reflection.resolved, 0) = ?"));
        assertTrue(sql.contains("LIMIT ?"));
    }

    @Test
    void profileAndReportWritesUseIdempotentOwnerScopedUpserts() {
        String profileSql = sqlFor(
            LearningProfileMapper.class, "save", Map.of("profile", new Object()));
        String reportSql = sqlFor(
            LearningAnalyticsMapper.class, "saveQuestionReport", Map.of("report", new Object()));

        assertTrue(profileSql.contains("ON DUPLICATE KEY UPDATE"));
        assertTrue(profileSql.contains("user_id"));
        assertTrue(reportSql.contains("ON DUPLICATE KEY UPDATE"));
        assertTrue(reportSql.contains("user_id"));
        assertFalse(reportSql.contains("sat_question_quality"));
    }

    private String sqlFor(Class<?> mapper, String method, Map<String, Object> parameters) {
        MappedStatement statement = configuration.getMappedStatement(
            mapper.getName() + "." + method);
        return statement.getBoundSql(parameters).getSql().replaceAll("\\s+", " ").trim();
    }
}
