package com.sts.sale.mapper;

import com.sts.sale.model.LearningProfile;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface LearningProfileMapper {

    @Select("SELECT * FROM learning_profiles WHERE user_id = #{userId}")
    LearningProfile findByUserId(@Param("userId") Long userId);

    @Insert({
        "INSERT INTO learning_profiles (",
        "user_id, test_date, target_score, baseline_score, available_days, daily_minutes",
        ") VALUES (",
        "#{profile.userId}, #{profile.testDate}, #{profile.targetScore},",
        "#{profile.baselineScore}, #{profile.availableDays}, #{profile.dailyMinutes}",
        ") ON DUPLICATE KEY UPDATE",
        "test_date = VALUES(test_date), target_score = VALUES(target_score),",
        "baseline_score = VALUES(baseline_score), available_days = VALUES(available_days),",
        "daily_minutes = VALUES(daily_minutes)"
    })
    int save(@Param("profile") LearningProfile profile);
}
