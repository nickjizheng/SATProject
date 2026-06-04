package com.sts.sale.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    private static final Logger logger = LoggerFactory.getLogger(MailConfig.class);

    @Value("${spring.mail.host}")
    private String host;

    @Value("${spring.mail.port}")
    private int port;

    @Value("${spring.mail.username}")
    private String username;

    @Value("${spring.mail.password}")
    private String password;

    @Value("${spring.mail.sslEnable:true}")
    private boolean sslEnable;

    @Bean
    public JavaMailSender javaMailSender() {
        logger.info("开始配置JavaMailSender - 主机: {}, 端口: {}, 用户名: {}", host, port, username);
        
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        // 设置邮件服务器配置
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);
        
        logger.debug("邮件服务器配置完成 - 主机: {}, 端口: {}", host, port);
        
        // 设置JavaMail属性
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        
        if (sslEnable) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.ssl.trust", host);
        }
        
        // 设置连接超时
        props.put("mail.smtp.connectiontimeout", "60000");
        props.put("mail.smtp.timeout", "120000");
        props.put("mail.smtp.writetimeout", "60000");
        
        // 设置调试模式（可选）
        props.put("mail.debug", "false");
        
        logger.info("JavaMailSender配置完成 - SSL启用: {}", sslEnable);
        
        return mailSender;
    }
}
