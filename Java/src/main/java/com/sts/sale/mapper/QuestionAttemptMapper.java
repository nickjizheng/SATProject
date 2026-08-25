package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.model.QuestionAttempt;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface QuestionAttemptMapper extends BaseMapper<QuestionAttempt> {

    /**
     * Inserts an immutable attempt once. The unique submission ID makes client
     * retries safe, including when two copies of the same request arrive together.
     */
    @Insert({
        "INSERT IGNORE INTO question_attempts (",
        "submission_id, user_id, session_id, question_id, user_answer, is_correct,",
        "study_mode, response_time_ms, stage_before, default_stage,",
        "default_next_review_at, submitted_at",
        ") VALUES (",
        "#{attempt.submissionId}, #{attempt.userId}, #{attempt.sessionId},",
        "#{attempt.questionId}, #{attempt.userAnswer}, #{attempt.isCorrect},",
        "#{attempt.studyMode}, #{attempt.responseTimeMs}, #{attempt.stageBefore},",
        "#{attempt.defaultStage}, #{attempt.defaultNextReviewAt}, #{attempt.submittedAt}",
        ")"
    })
    @Options(useGeneratedKeys = true, keyProperty = "attempt.id")
    int insertIfAbsent(@Param("attempt") QuestionAttempt attempt);

    @Select("SELECT * FROM question_attempts WHERE submission_id = #{submissionId} LIMIT 1")
    QuestionAttempt findBySubmissionId(@Param("submissionId") String submissionId);

    @Select({
        "SELECT * FROM question_attempts",
        "WHERE user_id = #{userId} AND question_id = #{questionId}",
        "ORDER BY submitted_at DESC, id DESC LIMIT 1"
    })
    QuestionAttempt findLatestForUser(@Param("userId") Long userId,
                                      @Param("questionId") Integer questionId);
}
