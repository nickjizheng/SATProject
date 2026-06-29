package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.model.SatQuestion;
import org.apache.ibatis.annotations.Mapper;
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
    @Select("SELECT * FROM sat_questions WHERE UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D') ORDER BY RAND() LIMIT #{limit}")
    List<SatQuestion> getRandomQuestions(int limit);

    /**
     * 根据领域获取题目
     * @param domain 题目领域
     * @param limit 题目数量
     * @return 题目列表
     */
    @Select("SELECT * FROM sat_questions WHERE domain = #{domain} AND UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D') ORDER BY RAND() LIMIT #{limit}")
    List<SatQuestion> getQuestionsByDomain(String domain, int limit);

    /**
     * 获取所有领域列表
     * @return 领域列表
     */
    @Select("SELECT DISTINCT domain FROM sat_questions WHERE domain IS NOT NULL AND UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D')")
    List<String> getAllDomains();
}
