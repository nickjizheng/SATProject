package com.sts.sale.service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;


@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String sender;

    // 发送带HTML内容的邮件
    public void sendHtmlMail(String email, String verificationCode) throws MessagingException {
        logger.info("开始发送验证邮件 - 收件人: {}, 发件人: {}, 验证码: {}", 
                   email, sender, maskVerificationCode(verificationCode));
        
        try {
            logger.debug("创建MimeMessage - 收件人: {}", email);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            logger.debug("设置邮件基本信息 - 收件人: {}, 主题: {}", email, "Invitation to Register on FoodSale");
            helper.setTo(email);
            helper.setSubject("Invitation to Register on FoodSale");
            helper.setFrom(sender);

            // 将HTML模板放在此处，并动态插入验证码
            logger.debug("生成HTML邮件内容 - 收件人: {}", email);
            String htmlContent = getHtmlTemplate(verificationCode);
            helper.setText(htmlContent, true); // 第二个参数为 true 表示这是 HTML 邮件

            logger.debug("准备发送邮件 - 收件人: {}", email);
            mailSender.send(message);
            
            logger.info("验证邮件发送成功 - 收件人: {}, 验证码: {}", 
                       email, maskVerificationCode(verificationCode));
            
        } catch (MessagingException e) {
            logger.error("验证邮件发送失败 - 收件人: {}, 错误: {}", email, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            logger.error("验证邮件发送过程中发生未知错误 - 收件人: {}, 错误: {}", email, e.getMessage(), e);
            throw new MessagingException("邮件发送失败: " + e.getMessage(), e);
        }
    }

    // HTML模板
    private String getHtmlTemplate(String verificationCode) {
        logger.debug("生成HTML邮件模板 - 验证码长度: {}", verificationCode.length());
        
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "  <head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Invitation to Register on FoodSale</title>\n" +
                "    <style>\n" +
                "      body {\n" +
                "        font-family: 'Helvetica', Arial, sans-serif;\n" +
                "        background-color: #f8f8f8;\n" +
                "        color: #333;\n" +
                "        margin: 0;\n" +
                "        padding: 0;\n" +
                "      }\n" +
                "      .container {\n" +
                "        max-width: 600px;\n" +
                "        margin: 20px auto;\n" +
                "        background-color: #fff;\n" +
                "        padding: 20px;\n" +
                "        border-radius: 8px;\n" +
                "        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);\n" +
                "      }\n" +
                "      h2 {\n" +
                "        color: #4CAF50;\n" +
                "        margin-bottom: 20px;\n" +
                "      }\n" +
                "      p {\n" +
                "        margin-bottom: 15px;\n" +
                "        line-height: 1.6;\n" +
                "      }\n" +
                "      .verification-code {\n" +
                "        font-size: 20px;\n" +
                "        font-weight: bold;\n" +
                "        color: red;\n" +
                "      }\n" +
                "    </style>\n" +
                "  </head>\n" +
                "  <body>\n" +
                "    <div class=\"container\">\n" +
                "      <h2>You're Invited to Register on FoodSale!</h2>\n" +
                "      <p>Dear user,</p>\n" +
                "      <p>You have been invited to register on FoodSale. Take advantage of our service by creating your account today!</p>\n" +
                "      <p>Your verification code is: <span class=\"verification-code\">" + verificationCode + "</span></p>\n" +
                "    </div>\n" +
                "  </body>\n" +
                "</html>";
    }
    
    /**
     * 掩码验证码，保护敏感信息
     */
    private String maskVerificationCode(String code) {
        if (code == null || code.length() <= 2) {
            return "***";
        }
        return code.substring(0, 1) + "***" + code.substring(code.length() - 1);
    }
}


