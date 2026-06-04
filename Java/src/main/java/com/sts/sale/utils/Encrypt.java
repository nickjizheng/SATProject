package com.sts.sale.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class Encrypt {
    public static String encryptPassword(String password) {
        try {
            // 创建一个MessageDigest实例，指定使用MD5算法
            MessageDigest md = MessageDigest.getInstance("MD5");

            // 将密码转换为字节数组并更新MessageDigest对象
            md.update(password.getBytes());

            // 执行哈希计算并获取哈希值字节数组
            byte[] digest = md.digest();

            // 将字节数组转换为16进制格式的字符串
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }

            // 返回加密后的字符串
            return sb.toString();

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 algorithm not found", e);
        }
    }
}
