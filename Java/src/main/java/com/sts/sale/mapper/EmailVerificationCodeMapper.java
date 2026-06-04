package com.sts.sale.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sts.sale.model.EmailVerificationCode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

/**
 * 邮箱验证码Mapper接口
 */
@Mapper
public interface EmailVerificationCodeMapper extends BaseMapper<EmailVerificationCode> {
    
    /**
     * 查找有效的验证码
     */
    @Select("SELECT * FROM email_verification_codes WHERE email = #{email} AND code = #{code} AND type = #{type} AND used = 0 AND expires_at > #{now}")
    EmailVerificationCode findValidCode(String email, String code, String type, LocalDateTime now);
    
    /**
     * 标记验证码为已使用
     */
    @Update("UPDATE email_verification_codes SET used = 1 WHERE id = #{id}")
    int markCodeAsUsed(Long id);
    
    /**
     * 清理过期的验证码
     */
    @Update("UPDATE email_verification_codes SET used = 1 WHERE email = #{email} AND expires_at <= #{now}")
    int cleanExpiredCodes(String email, LocalDateTime now);
}
