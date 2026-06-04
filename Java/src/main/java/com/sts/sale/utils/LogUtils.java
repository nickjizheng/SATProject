package com.sts.sale.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 日志工具类
 * 提供统一的日志记录方法和格式
 */
public class LogUtils {
    
    /**
     * 获取Logger实例
     */
    public static Logger getLogger(Class<?> clazz) {
        return LoggerFactory.getLogger(clazz);
    }
    
    /**
     * 记录方法进入日志
     */
    public static void logMethodEntry(Logger logger, String methodName, Object... params) {
        if (logger.isDebugEnabled()) {
            StringBuilder sb = new StringBuilder();
            sb.append("进入方法: ").append(methodName);
            if (params != null && params.length > 0) {
                sb.append(" - 参数: ");
                for (int i = 0; i < params.length; i += 2) {
                    if (i + 1 < params.length) {
                        sb.append(params[i]).append("=").append(params[i + 1]);
                    } else {
                        sb.append(params[i]);
                    }
                    if (i + 2 < params.length) {
                        sb.append(", ");
                    }
                }
            }
            logger.debug(sb.toString());
        }
    }
    
    /**
     * 记录方法退出日志
     */
    public static void logMethodExit(Logger logger, String methodName, Object result) {
        if (logger.isDebugEnabled()) {
            if (result != null) {
                logger.debug("退出方法: {} - 返回值: {}", methodName, result);
            } else {
                logger.debug("退出方法: {} - 无返回值", methodName);
            }
        }
    }
    
    /**
     * 记录异常日志
     */
    public static void logException(Logger logger, String methodName, String message, Throwable e) {
        logger.error("方法 {} 执行异常: {} - 异常信息: {}", methodName, message, e.getMessage(), e);
    }
    
    /**
     * 记录业务操作日志
     */
    public static void logBusinessOperation(Logger logger, String operation, String userId, String details) {
        logger.info("业务操作: {} - 用户ID: {} - 详情: {}", operation, userId, details);
    }
    
    /**
     * 记录性能日志
     */
    public static void logPerformance(Logger logger, String operation, long startTime, long endTime) {
        long duration = endTime - startTime;
        if (duration > 1000) { // 超过1秒记录警告
            logger.warn("性能警告: {} 耗时 {}ms", operation, duration);
        } else if (duration > 500) { // 超过500ms记录信息
            logger.info("性能信息: {} 耗时 {}ms", operation, duration);
        } else {
            logger.debug("性能信息: {} 耗时 {}ms", operation, duration);
        }
    }
    
    /**
     * 记录数据库操作日志
     */
    public static void logDatabaseOperation(Logger logger, String operation, String table, Object id, String details) {
        logger.debug("数据库操作: {} - 表: {} - ID: {} - 详情: {}", operation, table, id, details);
    }
    
    /**
     * 记录邮件操作日志
     */
    public static void logEmailOperation(Logger logger, String operation, String email, String status, String details) {
        logger.info("邮件操作: {} - 邮箱: {} - 状态: {} - 详情: {}", operation, email, status, details);
    }
    
    /**
     * 记录安全相关日志
     */
    public static void logSecurity(Logger logger, String operation, String username, String ip, String details) {
        logger.warn("安全事件: {} - 用户名: {} - IP: {} - 详情: {}", operation, username, ip, details);
    }
    
    /**
     * 掩码敏感信息
     */
    public static String maskSensitiveInfo(String info, String type) {
        if (info == null || info.length() <= 2) {
            return "***";
        }
        
        switch (type.toLowerCase()) {
            case "password":
                return "******";
            case "email":
                // 邮箱格式: a***@b.com
                int atIndex = info.indexOf('@');
                if (atIndex > 1) {
                    return info.charAt(0) + "***" + info.substring(atIndex);
                }
                return "***";
            case "phone":
                // 手机号格式: 138****8888
                if (info.length() >= 11) {
                    return info.substring(0, 3) + "****" + info.substring(7);
                }
                return "***";
            case "verification_code":
                // 验证码格式: 1***6
                return info.charAt(0) + "***" + info.charAt(info.length() - 1);
            default:
                return info.charAt(0) + "***" + info.charAt(info.length() - 1);
        }
    }
}
