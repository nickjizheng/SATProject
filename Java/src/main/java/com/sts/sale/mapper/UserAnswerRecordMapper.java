package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.model.SatQuestion;
import com.sts.sale.model.UserAnswerRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户答题记录Mapper接口
 */
@Mapper
public interface UserAnswerRecordMapper extends BaseMapper<UserAnswerRecord> {
    
    /**
     * 获取用户未做过的题目
     * @param sessionId 会话ID
     * @param domain 题目领域（可选）
     * @param limit 限制数量
     * @return 未做过的题目列表
     */
    @Select({
        "<script>",
        "SELECT sq.* FROM sat_questions sq ",
        "WHERE sq.id NOT IN (",
        "  SELECT DISTINCT uar.question_id FROM user_answer_records uar ",
        "  WHERE uar.session_id = #{sessionId}",
        ")",
        "<if test='domain != null and domain != \"\"'>",
        "  AND sq.domain = #{domain}",
        "</if>",
        "ORDER BY RAND() LIMIT #{limit}",
        "</script>"
    })
    List<SatQuestion> getUnansweredQuestions(@Param("sessionId") String sessionId, 
                                             @Param("domain") String domain, 
                                             @Param("limit") int limit);
    
    /**
     * 获取用户已做过的题目ID列表
     * @param sessionId 会话ID
     * @return 已做过的题目ID列表
     */
    @Select("SELECT DISTINCT question_id FROM user_answer_records WHERE session_id = #{sessionId}")
    List<Integer> getAnsweredQuestionIds(@Param("sessionId") String sessionId);
    
    /**
     * 检查用户是否已做过某道题
     * @param sessionId 会话ID
     * @param questionId 题目ID
     * @return 是否已做过
     */
    @Select("SELECT COUNT(*) > 0 FROM user_answer_records WHERE session_id = #{sessionId} AND question_id = #{questionId}")
    boolean hasAnsweredQuestion(@Param("sessionId") String sessionId, @Param("questionId") Integer questionId);
}
