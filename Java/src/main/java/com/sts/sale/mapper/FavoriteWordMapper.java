package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.model.FavoriteWord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface FavoriteWordMapper extends BaseMapper<FavoriteWord> {
    
    @Select("SELECT * FROM favorite_words WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<FavoriteWord> findByUserId(@Param("userId") Long userId);
    
    @Select("SELECT * FROM favorite_words WHERE user_id = #{userId} AND word = #{word}")
    FavoriteWord findByUserIdAndWord(@Param("userId") Long userId, @Param("word") String word);
}
