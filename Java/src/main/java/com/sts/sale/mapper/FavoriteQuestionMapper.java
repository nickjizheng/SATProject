package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.model.FavoriteQuestion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface FavoriteQuestionMapper extends BaseMapper<FavoriteQuestion> {
    
    @Select("SELECT * FROM favorite_questions WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<FavoriteQuestion> findByUserId(@Param("userId") Long userId);
    
    @Select("SELECT * FROM favorite_questions WHERE user_id = #{userId} AND question_id = #{questionId}")
    FavoriteQuestion findByUserIdAndQuestionId(@Param("userId") Long userId, @Param("questionId") Long questionId);
}
