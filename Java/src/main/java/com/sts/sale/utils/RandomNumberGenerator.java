package com.sts.sale.utils;

import org.springframework.stereotype.Component;
import java.util.Random;

@Component
public class RandomNumberGenerator {
    
    public String generateRandomNumber() {
        Random random = new Random();
        // 生成 1000 到 9999 之间的随机数
        return Integer.toString(random.nextInt(9000) + 1000);
    }
    
    /**
     * 生成6位数字验证码
     */
    public String generateVerificationCode() {
        Random random = new Random();
        // 生成 100000 到 999999 之间的6位数字
        return String.format("%06d", random.nextInt(900000) + 100000);
    }
}
