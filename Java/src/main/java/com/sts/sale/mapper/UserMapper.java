package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 根据用户名查找用户
     */
    @Select("SELECT * FROM users WHERE username = #{username}")
    User findByUsername(String username);

    /**
     * 根据邮箱查找用户
     */
    @Select("SELECT * FROM users WHERE email = #{email}")
    User findByEmail(String email);

    /**
     * Find the account permanently linked to a Google identity.
     */
    @Select("SELECT * FROM users WHERE google_subject = #{googleSubject}")
    User findByGoogleSubject(String googleSubject);

    /**
     * 根据用户名或邮箱查找用户
     */
    @Select("SELECT * FROM users WHERE username = #{usernameOrEmail} OR email = #{usernameOrEmail}")
    User findByUsernameOrEmail(String usernameOrEmail);
}
