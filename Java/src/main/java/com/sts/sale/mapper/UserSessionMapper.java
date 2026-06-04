package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.model.UserSession;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 用户会话Mapper接口
 */
@Mapper
public interface UserSessionMapper extends BaseMapper<UserSession> {
    
    /**
     * 根据token哈希查找会话
     */
    @Select("SELECT * FROM user_sessions WHERE token_hash = #{tokenHash}")
    UserSession findByTokenHash(String tokenHash);
}
