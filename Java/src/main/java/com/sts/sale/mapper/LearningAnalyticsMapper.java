package com.sts.sale.mapper;

import com.sts.sale.model.MistakeReflection;
import com.sts.sale.model.MistakeRow;
import com.sts.sale.model.MistakeSummaryGroup;
import com.sts.sale.model.QuestionReport;
import com.sts.sale.model.ReadinessAggregateRow;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface LearningAnalyticsMapper {

    /**
     * Correctness is deliberately recalculated from the current answer key.
     * This prevents a corrected source key from leaving stale analytics behind.
     */
    @Select({
        "SELECT TRIM(sq.domain) AS domain,",
        "COUNT(attempt.id) AS attempts,",
        "COALESCE(SUM(CASE WHEN UPPER(TRIM(attempt.user_answer)) = UPPER(TRIM(sq.correct_answer)) THEN 1 ELSE 0 END), 0) AS correct_attempts,",
        "COALESCE(ROUND(100.0 * SUM(CASE WHEN UPPER(TRIM(attempt.user_answer)) = UPPER(TRIM(sq.correct_answer)) THEN 1 ELSE 0 END) / NULLIF(COUNT(attempt.id), 0), 1), 0) AS accuracy_percent,",
        "ROUND(AVG(attempt.response_time_ms), 0) AS average_response_time_ms,",
        "COALESCE(SUM(CASE WHEN attempt.submitted_at >= #{recentStart} THEN 1 ELSE 0 END), 0) AS recent_attempts,",
        "COALESCE(SUM(CASE WHEN attempt.submitted_at >= #{recentStart} AND UPPER(TRIM(attempt.user_answer)) = UPPER(TRIM(sq.correct_answer)) THEN 1 ELSE 0 END), 0) AS recent_correct_attempts,",
        "COALESCE(SUM(CASE WHEN attempt.submitted_at >= #{previousStart} AND attempt.submitted_at < #{recentStart} THEN 1 ELSE 0 END), 0) AS previous_attempts,",
        "COALESCE(SUM(CASE WHEN attempt.submitted_at >= #{previousStart} AND attempt.submitted_at < #{recentStart} AND UPPER(TRIM(attempt.user_answer)) = UPPER(TRIM(sq.correct_answer)) THEN 1 ELSE 0 END), 0) AS previous_correct_attempts",
        "FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "LEFT JOIN question_attempts attempt ON attempt.question_id = sq.id AND attempt.user_id = #{userId}",
        "WHERE sq.domain IS NOT NULL AND TRIM(sq.domain) != ''",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "GROUP BY TRIM(sq.domain)",
        "ORDER BY TRIM(sq.domain)"
    })
    List<ReadinessAggregateRow> findReadiness(
        @Param("userId") Long userId,
        @Param("recentStart") LocalDateTime recentStart,
        @Param("previousStart") LocalDateTime previousStart);

    @Select({
        "<script>",
        "SELECT sq.id AS question_id, sq.domain, sq.visuals_type, sq.visuals_svg_content,",
        "sq.question_text, sq.question_paragraph, sq.choice_a, sq.choice_b, sq.choice_c, sq.choice_d,",
        "UPPER(TRIM(sq.correct_answer)) AS correct_answer, sq.question_explanation AS explanation,",
        "UPPER(TRIM(attempt.user_answer)) AS selected_answer, attempt.response_time_ms,",
        "attempt.submitted_at AS occurred_at,",
        "COALESCE(reflection.reason, 'UNCLASSIFIED') AS reason, reflection.confidence, reflection.note,",
        "COALESCE(reflection.resolved, 0) AS resolved",
        "FROM question_attempts attempt",
        "JOIN sat_questions sq ON sq.id = attempt.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "LEFT JOIN mistake_reflections reflection",
        "ON reflection.user_id = attempt.user_id AND reflection.question_id = attempt.question_id",
        "WHERE attempt.user_id = #{userId}",
        "AND UPPER(TRIM(attempt.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "AND NOT EXISTS (",
        "  SELECT 1 FROM question_attempts newer",
        "  WHERE newer.user_id = attempt.user_id AND newer.question_id = attempt.question_id",
        "  AND UPPER(TRIM(newer.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "  AND (newer.submitted_at > attempt.submitted_at",
        "       OR (newer.submitted_at = attempt.submitted_at AND newer.id > attempt.id))",
        ")",
        "<if test='reason != null and reason != \"\"'>",
        "AND COALESCE(reflection.reason, 'UNCLASSIFIED') = #{reason}",
        "</if>",
        "<if test='domain != null and domain != \"\"'>",
        "AND TRIM(sq.domain) = #{domain}",
        "</if>",
        "<if test='resolved != null'>",
        "AND COALESCE(reflection.resolved, 0) = #{resolved}",
        "</if>",
        "ORDER BY attempt.submitted_at DESC, attempt.id DESC LIMIT #{limit}",
        "</script>"
    })
    List<MistakeRow> findMistakes(@Param("userId") Long userId,
                                  @Param("reason") String reason,
                                  @Param("domain") String domain,
                                  @Param("resolved") Boolean resolved,
                                  @Param("limit") int limit);

    @Select({
        "SELECT sq.id AS question_id, sq.domain, sq.visuals_type, sq.visuals_svg_content,",
        "sq.question_text, sq.question_paragraph, sq.choice_a, sq.choice_b, sq.choice_c, sq.choice_d,",
        "UPPER(TRIM(sq.correct_answer)) AS correct_answer, sq.question_explanation AS explanation,",
        "UPPER(TRIM(attempt.user_answer)) AS selected_answer, attempt.response_time_ms,",
        "attempt.submitted_at AS occurred_at,",
        "COALESCE(reflection.reason, 'UNCLASSIFIED') AS reason, reflection.confidence, reflection.note,",
        "COALESCE(reflection.resolved, 0) AS resolved",
        "FROM question_attempts attempt",
        "JOIN sat_questions sq ON sq.id = attempt.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "LEFT JOIN mistake_reflections reflection",
        "ON reflection.user_id = attempt.user_id AND reflection.question_id = attempt.question_id",
        "WHERE attempt.user_id = #{userId} AND attempt.question_id = #{questionId}",
        "AND UPPER(TRIM(attempt.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "ORDER BY attempt.submitted_at DESC, attempt.id DESC LIMIT 1"
    })
    MistakeRow findMistake(@Param("userId") Long userId,
                           @Param("questionId") Integer questionId);

    @Select({
        "SELECT COUNT(*) FROM question_attempts attempt",
        "JOIN sat_questions sq ON sq.id = attempt.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE attempt.user_id = #{userId} AND attempt.question_id = #{questionId}",
        "AND UPPER(TRIM(attempt.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')"
    })
    long countCurrentIncorrectAttempts(@Param("userId") Long userId,
                                       @Param("questionId") Integer questionId);

    @Insert({
        "INSERT INTO mistake_reflections (",
        "user_id, question_id, reason, confidence, note, resolved",
        ") VALUES (",
        "#{reflection.userId}, #{reflection.questionId}, #{reflection.reason},",
        "#{reflection.confidence}, #{reflection.note}, #{reflection.resolved}",
        ") ON DUPLICATE KEY UPDATE reason = VALUES(reason), confidence = VALUES(confidence),",
        "note = VALUES(note), resolved = VALUES(resolved)"
    })
    int saveReflection(@Param("reflection") MistakeReflection reflection);

    @Select({
        "SELECT COUNT(*) FROM question_attempts attempt",
        "JOIN sat_questions sq ON sq.id = attempt.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "LEFT JOIN mistake_reflections reflection",
        "ON reflection.user_id = attempt.user_id AND reflection.question_id = attempt.question_id",
        "WHERE attempt.user_id = #{userId}",
        "AND UPPER(TRIM(attempt.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "AND COALESCE(reflection.resolved, 0) = 0",
        "AND NOT EXISTS (",
        "  SELECT 1 FROM question_attempts newer",
        "  WHERE newer.user_id = attempt.user_id AND newer.question_id = attempt.question_id",
        "  AND UPPER(TRIM(newer.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "  AND (newer.submitted_at > attempt.submitted_at",
        "       OR (newer.submitted_at = attempt.submitted_at AND newer.id > attempt.id))",
        ")"
    })
    long countUnresolvedMistakes(@Param("userId") Long userId);

    @Select({
        "SELECT COALESCE(reflection.reason, 'UNCLASSIFIED') AS label, COUNT(*) AS count",
        "FROM question_attempts attempt",
        "JOIN sat_questions sq ON sq.id = attempt.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "LEFT JOIN mistake_reflections reflection",
        "ON reflection.user_id = attempt.user_id AND reflection.question_id = attempt.question_id",
        "WHERE attempt.user_id = #{userId}",
        "AND UPPER(TRIM(attempt.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "AND COALESCE(reflection.resolved, 0) = 0",
        "AND NOT EXISTS (",
        "  SELECT 1 FROM question_attempts newer",
        "  WHERE newer.user_id = attempt.user_id AND newer.question_id = attempt.question_id",
        "  AND UPPER(TRIM(newer.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "  AND (newer.submitted_at > attempt.submitted_at",
        "       OR (newer.submitted_at = attempt.submitted_at AND newer.id > attempt.id))",
        ")",
        "GROUP BY COALESCE(reflection.reason, 'UNCLASSIFIED') ORDER BY count DESC, label"
    })
    List<MistakeSummaryGroup> summarizeUnresolvedByReason(@Param("userId") Long userId);

    @Select({
        "SELECT TRIM(sq.domain) AS label, COUNT(*) AS count",
        "FROM question_attempts attempt",
        "JOIN sat_questions sq ON sq.id = attempt.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "LEFT JOIN mistake_reflections reflection",
        "ON reflection.user_id = attempt.user_id AND reflection.question_id = attempt.question_id",
        "WHERE attempt.user_id = #{userId}",
        "AND UPPER(TRIM(attempt.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "AND COALESCE(reflection.resolved, 0) = 0",
        "AND NOT EXISTS (",
        "  SELECT 1 FROM question_attempts newer",
        "  WHERE newer.user_id = attempt.user_id AND newer.question_id = attempt.question_id",
        "  AND UPPER(TRIM(newer.user_answer)) != UPPER(TRIM(sq.correct_answer))",
        "  AND (newer.submitted_at > attempt.submitted_at",
        "       OR (newer.submitted_at = attempt.submitted_at AND newer.id > attempt.id))",
        ")",
        "GROUP BY TRIM(sq.domain) ORDER BY count DESC, label"
    })
    List<MistakeSummaryGroup> summarizeUnresolvedByDomain(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM sat_questions WHERE id = #{questionId}")
    long countQuestion(@Param("questionId") Integer questionId);

    @Insert({
        "INSERT INTO question_reports (user_id, question_id, reason, detail)",
        "VALUES (#{report.userId}, #{report.questionId}, #{report.reason}, #{report.detail})",
        "ON DUPLICATE KEY UPDATE detail = VALUES(detail)"
    })
    int saveQuestionReport(@Param("report") QuestionReport report);

    @Select({
        "SELECT * FROM question_reports",
        "WHERE user_id = #{userId} AND question_id = #{questionId} AND reason = #{reason}",
        "LIMIT 1"
    })
    QuestionReport findQuestionReport(@Param("userId") Long userId,
                                      @Param("questionId") Integer questionId,
                                      @Param("reason") String reason);

    @Select({
        "SELECT * FROM question_reports",
        "WHERE user_id = #{userId} AND question_id = #{questionId}",
        "ORDER BY updated_at DESC, id DESC"
    })
    List<QuestionReport> findQuestionReports(@Param("userId") Long userId,
                                             @Param("questionId") Integer questionId);
}
