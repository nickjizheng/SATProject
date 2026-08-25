package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.dto.QuestionBankBreakdown;
import com.sts.sale.model.SatQuestion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * SAT题目Mapper接口
 */
@Mapper
public interface SatQuestionMapper extends BaseMapper<SatQuestion> {

    /**
     * 随机获取指定数量的题目
     * @param limit 题目数量
     * @return 题目列表
     */
    @Select({
        "SELECT sq.* FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "ORDER BY RAND() LIMIT #{limit}"
    })
    List<SatQuestion> getRandomQuestions(int limit);

    /**
     * 根据领域获取题目
     * @param domain 题目领域
     * @param limit 题目数量
     * @return 题目列表
     */
    @Select({
        "SELECT sq.* FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE TRIM(sq.domain) = #{domain}",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "ORDER BY RAND() LIMIT #{limit}"
    })
    List<SatQuestion> getQuestionsByDomain(String domain, int limit);

    /**
     * 获取所有领域列表
     * @return 领域列表
     */
    @Select({
        "SELECT TRIM(sq.domain) AS domain FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE sq.domain IS NOT NULL",
        "AND TRIM(sq.domain) <> ''",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "GROUP BY TRIM(sq.domain)",
        "HAVING COUNT(*) > 0",
        "ORDER BY TRIM(sq.domain)"
    })
    List<String> getAllDomains();

    @Select({
        "SELECT sq.* FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE sq.id = #{id}",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')"
    })
    SatQuestion selectUsableById(@Param("id") Integer id);

    @Select({
        "<script>",
        "SELECT sq.* FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "AND NOT EXISTS (",
        "  SELECT 1 FROM user_answer_records record",
        "  WHERE record.session_id = #{sessionId} AND record.question_id = sq.id",
        ")",
        "<if test='domain != null and domain != \"\"'>",
        "  AND TRIM(sq.domain) = #{domain}",
        "</if>",
        "ORDER BY RAND() LIMIT #{limit}",
        "</script>"
    })
    List<SatQuestion> getUnansweredForSession(@Param("sessionId") String sessionId,
                                              @Param("domain") String domain,
                                              @Param("limit") int limit);

    @Select({
        "<script>",
        "SELECT sq.* FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "AND NOT EXISTS (",
        "  SELECT 1 FROM user_answer_records record",
        "  WHERE record.user_id = #{userId} AND record.question_id = sq.id",
        ")",
        "<if test='domain != null and domain != \"\"'>",
        "  AND TRIM(sq.domain) = #{domain}",
        "</if>",
        "ORDER BY RAND() LIMIT #{limit}",
        "</script>"
    })
    List<SatQuestion> getUnansweredForUser(@Param("userId") Integer userId,
                                           @Param("domain") String domain,
                                           @Param("limit") int limit);

    @Select({
        "<script>",
        "SELECT COUNT(*) FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "<if test='domain != null and domain != \"\"'>",
        "  AND TRIM(sq.domain) = #{domain}",
        "</if>",
        "</script>"
    })
    long countUsableQuestions(@Param("domain") String domain);

    @Select({
        "<script>",
        "SELECT COUNT(DISTINCT record.question_id) FROM user_answer_records record",
        "JOIN sat_questions sq ON sq.id = record.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE record.user_id = #{userId}",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "<if test='domain != null and domain != \"\"'>",
        "  AND TRIM(sq.domain) = #{domain}",
        "</if>",
        "</script>"
    })
    long countAnsweredForUser(@Param("userId") Integer userId,
                              @Param("domain") String domain);

    @Select({
        "<script>",
        "SELECT COUNT(DISTINCT record.question_id) FROM user_answer_records record",
        "JOIN sat_questions sq ON sq.id = record.question_id",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "WHERE record.session_id = #{sessionId}",
        "AND UPPER(TRIM(sq.correct_answer)) IN ('A', 'B', 'C', 'D')",
        "<if test='domain != null and domain != \"\"'>",
        "  AND TRIM(sq.domain) = #{domain}",
        "</if>",
        "</script>"
    })
    long countAnsweredForSession(@Param("sessionId") String sessionId,
                                 @Param("domain") String domain);

    @Select("SELECT COUNT(*) FROM sat_questions")
    long countAllQuestions();

    @Select("SELECT COUNT(*) FROM sat_question_quality WHERE usable = 0")
    long countQuarantinedQuestions();

    @Select("SELECT COUNT(*) FROM sat_question_quality WHERE quality_status = 'duplicate'")
    long countDuplicateQuestions();

    @Select({
        "SELECT sq.domain AS label, COUNT(*) AS count FROM sat_questions sq",
        "JOIN sat_question_quality quality ON quality.question_id = sq.id AND quality.usable = 1",
        "GROUP BY sq.domain ORDER BY sq.domain"
    })
    List<QuestionBankBreakdown> getUsableCountsByDomain();

    @Select({
        "SELECT quality_status AS label, COUNT(*) AS count FROM sat_question_quality",
        "GROUP BY quality_status ORDER BY quality_status"
    })
    List<QuestionBankBreakdown> getCountsByQualityStatus();
}
