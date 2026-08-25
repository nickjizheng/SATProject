package com.sts.sale.mapper;

import com.sts.sale.dto.ReviewSummary;
import com.sts.sale.model.ReviewForecastBucket;
import com.sts.sale.model.ReviewQueueRow;
import com.sts.sale.model.UserQuestionReviewState;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface UserQuestionReviewStateMapper {

    @Select({
        "SELECT * FROM user_question_review_state",
        "WHERE user_id = #{userId} AND question_id = #{questionId}",
        "FOR UPDATE"
    })
    UserQuestionReviewState findForUpdate(@Param("userId") Long userId,
                                          @Param("questionId") Integer questionId);

    @Select({
        "SELECT * FROM user_question_review_state",
        "WHERE user_id = #{userId} AND question_id = #{questionId}"
    })
    UserQuestionReviewState find(@Param("userId") Long userId,
                                 @Param("questionId") Integer questionId);

    @Insert({
        "INSERT INTO user_question_review_state (",
        "user_id, question_id, stage, next_review_at, last_answered_at, last_correct,",
        "correct_streak, lapse_count, total_attempts, last_attempt_id, last_grade",
        ") VALUES (",
        "#{state.userId}, #{state.questionId}, #{state.stage}, #{state.nextReviewAt},",
        "#{state.lastAnsweredAt}, #{state.lastCorrect}, #{state.correctStreak},",
        "#{state.lapseCount}, #{state.totalAttempts}, #{state.lastAttemptId}, #{state.lastGrade}",
        ") ON DUPLICATE KEY UPDATE",
        "stage = VALUES(stage), next_review_at = VALUES(next_review_at),",
        "last_answered_at = VALUES(last_answered_at), last_correct = VALUES(last_correct),",
        "correct_streak = VALUES(correct_streak), lapse_count = VALUES(lapse_count),",
        "total_attempts = VALUES(total_attempts), last_attempt_id = VALUES(last_attempt_id),",
        "last_grade = VALUES(last_grade)"
    })
    int save(@Param("state") UserQuestionReviewState state);

    @Update({
        "UPDATE user_question_review_state",
        "SET stage = #{stage}, next_review_at = #{nextReviewAt}, last_grade = #{grade}",
        "WHERE user_id = #{userId} AND question_id = #{questionId}",
        "AND last_attempt_id = #{attemptId}"
    })
    int applyGrade(@Param("userId") Long userId,
                   @Param("questionId") Integer questionId,
                   @Param("attemptId") Long attemptId,
                   @Param("stage") Integer stage,
                   @Param("nextReviewAt") LocalDateTime nextReviewAt,
                   @Param("grade") String grade);

    @Select({
        "<script>",
        "SELECT sq.id, sq.original_id, sq.domain, sq.visuals_type, sq.visuals_svg_content,",
        "sq.question_text, sq.question_paragraph, sq.choice_a, sq.choice_b, sq.choice_c, sq.choice_d,",
        "state.stage AS review_stage, state.next_review_at, state.last_answered_at,",
        "state.last_correct, state.correct_streak, state.lapse_count, state.total_attempts",
        "FROM user_question_review_state state",
        "JOIN sat_questions sq ON sq.id = state.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE state.user_id = #{userId} AND state.next_review_at &lt;= #{now}",
        "<if test='domain != null and domain != \"\"'>",
        "AND sq.domain = #{domain}",
        "</if>",
        "ORDER BY state.next_review_at, state.stage, sq.id LIMIT #{limit}",
        "</script>"
    })
    List<ReviewQueueRow> findDueQueue(@Param("userId") Long userId,
                                      @Param("domain") String domain,
                                      @Param("now") LocalDateTime now,
                                      @Param("limit") int limit);

    @Select({
        "SELECT",
        "COUNT(*) AS total_scheduled,",
        "COALESCE(SUM(CASE WHEN state.next_review_at <= #{now} THEN 1 ELSE 0 END), 0) AS due_now,",
        "COALESCE(SUM(CASE WHEN state.stage <= 1 THEN 1 ELSE 0 END), 0) AS learning,",
        "COALESCE(SUM(CASE WHEN state.stage >= 5 THEN 1 ELSE 0 END), 0) AS mastered,",
        "COALESCE(ROUND(100.0 * SUM(CASE WHEN state.last_correct = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1), 0) AS retention_estimate,",
        "MIN(state.next_review_at) AS next_due_at,",
        "COALESCE(SUM(CASE WHEN state.last_answered_at >= #{dayStart} AND state.last_answered_at < #{dayEnd} THEN 1 ELSE 0 END), 0) AS reviewed_today",
        "FROM user_question_review_state state",
        "JOIN sat_question_quality quality ON quality.question_id = state.question_id AND quality.usable = 1",
        "WHERE state.user_id = #{userId}"
    })
    ReviewSummary getSummary(@Param("userId") Long userId,
                             @Param("now") LocalDateTime now,
                             @Param("dayStart") LocalDateTime dayStart,
                             @Param("dayEnd") LocalDateTime dayEnd);

    @Select({
        "SELECT CASE WHEN state.next_review_at < #{start} THEN DATE(#{start}) ELSE DATE(state.next_review_at) END AS date,",
        "COUNT(*) AS due_count,",
        "SUM(CASE WHEN state.stage <= 1 THEN 1 ELSE 0 END) AS learning,",
        "SUM(CASE WHEN state.stage > 1 THEN 1 ELSE 0 END) AS review",
        "FROM user_question_review_state state",
        "JOIN sat_question_quality quality ON quality.question_id = state.question_id AND quality.usable = 1",
        "WHERE state.user_id = #{userId}",
        "AND state.next_review_at < #{end}",
        "GROUP BY CASE WHEN state.next_review_at < #{start} THEN DATE(#{start}) ELSE DATE(state.next_review_at) END",
        "ORDER BY date"
    })
    List<ReviewForecastBucket> getForecast(@Param("userId") Long userId,
                                           @Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);
}
