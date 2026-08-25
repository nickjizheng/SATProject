package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import org.apache.ibatis.mapping.MappedStatement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserQuestionReviewStateMapperTest {

    private MybatisConfiguration configuration;

    @BeforeEach
    void registerMapper() {
        configuration = new MybatisConfiguration();
        configuration.addMapper(UserQuestionReviewStateMapper.class);
    }

    @Test
    void summaryComparisonOperatorsAreRenderedAsSqlRatherThanXmlEntities() {
        String sql = sqlFor("getSummary", Map.of(
            "userId", 7L,
            "now", LocalDateTime.of(2026, 8, 25, 10, 0),
            "dayStart", LocalDateTime.of(2026, 8, 25, 0, 0),
            "dayEnd", LocalDateTime.of(2026, 8, 26, 0, 0)
        ));

        assertFalse(sql.contains("&lt;"));
        assertFalse(sql.contains("&gt;"));
        assertTrue(sql.contains("state.next_review_at <= ?"));
        assertTrue(sql.contains("state.last_answered_at >= ?"));
    }

    @Test
    void forecastComparisonOperatorsAreRenderedAsSqlRatherThanXmlEntities() {
        String sql = sqlFor("getForecast", Map.of(
            "userId", 7L,
            "start", LocalDateTime.of(2026, 8, 25, 0, 0),
            "end", LocalDateTime.of(2026, 9, 1, 0, 0)
        ));

        assertFalse(sql.contains("&lt;"));
        assertFalse(sql.contains("&gt;"));
        assertTrue(sql.contains("state.next_review_at < ?"));
        assertTrue(sql.contains("state.stage > 1"));
    }

    @Test
    void queueDynamicSqlIncludesTheOptionalDomainFilter() {
        String sql = sqlFor("findDueQueue", Map.of(
            "userId", 7L,
            "domain", "Advanced Math",
            "now", LocalDateTime.of(2026, 8, 25, 10, 0),
            "limit", 20
        ));

        assertTrue(sql.contains("state.next_review_at <= ?"));
        assertTrue(sql.contains("sq.domain = ?"));
        assertTrue(sql.contains("LIMIT ?"));
    }

    private String sqlFor(String method, Map<String, Object> parameters) {
        MappedStatement statement = configuration.getMappedStatement(
            UserQuestionReviewStateMapper.class.getName() + "." + method);
        return statement.getBoundSql(parameters).getSql().replaceAll("\\s+", " ").trim();
    }
}
