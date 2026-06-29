package com.sts.sale.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private static final String HTML_TEMPLATE = """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light only">
            <title>Verify your SAT-Buddy account</title>
          </head>
          <body style="margin:0;padding:0;background:#f6f3ec;color:#2a2a2a;font-family:Arial,Helvetica,sans-serif;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              Use code {{CODE}} to finish creating your SAT-Buddy account. It expires in 10 minutes.
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f6f3ec;">
              <tr>
                <td align="center" style="padding:40px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e7e0d4;border-radius:24px;overflow:hidden;box-shadow:0 18px 55px rgba(18,61,58,.10);">
                    <tr>
                      <td style="padding:30px 36px;background:#123d3a;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td align="center" valign="middle" width="52" height="52" style="width:52px;height:52px;border-radius:17px;background:#f6f3ec;color:#e07a5f;font-size:30px;font-weight:700;line-height:52px;">✓</td>
                            <td style="padding-left:15px;">
                              <div style="color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1;">SAT<span style="color:#e07a5f;">-</span>Buddy</div>
                              <div style="padding-top:7px;color:#bcd2cf;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">By students, for students</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:42px 36px 18px;">
                        <div style="color:#e07a5f;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Account verification</div>
                        <h1 style="margin:14px 0;color:#2a2a2a;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.12;">One quick step,<br>then you can study.</h1>
                        <p style="margin:0;color:#66706d;font-size:16px;line-height:1.7;">Enter the code below on the SAT-Buddy registration page to verify your email address.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 36px;">
                        <div style="border:1px solid #eadfcb;border-radius:20px;background:#fffaf1;padding:25px 20px;text-align:center;">
                          <div style="margin-bottom:10px;color:#7c817f;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your verification code</div>
                          <div style="color:#123d3a;font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:700;letter-spacing:10px;line-height:1.2;">{{CODE}}</div>
                          <div style="margin-top:12px;color:#9a6d37;font-size:12px;font-weight:700;">Expires in 10 minutes</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 36px 42px;">
                        <p style="margin:0 0 18px;color:#66706d;font-size:13px;line-height:1.7;">If you did not request this code, you can safely ignore this email. Never share your verification code with anyone.</p>
                        <div style="border-top:1px solid #eee8de;padding-top:20px;color:#8a918e;font-size:12px;line-height:1.7;">
                          Sent by SAT-Buddy<br>
                          <a href="mailto:satbuddyteam@gmail.com" style="color:#123d3a;font-weight:700;text-decoration:none;">satbuddyteam@gmail.com</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <div style="padding-top:22px;color:#969b98;font-size:11px;">SAT-Buddy · Practice · Understand · Improve</div>
                </td>
              </tr>
            </table>
          </body>
        </html>
        """;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String sender;

    @Value("${spring.mail.sender-name:SAT-Buddy}")
    private String senderName;

    public void sendHtmlMail(String email, String verificationCode) throws MessagingException {
        logger.info("Sending verification email - recipient: {}, sender: {}, code: {}",
            email, sender, maskVerificationCode(verificationCode));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setTo(email);
            helper.setSubject("Verify your SAT-Buddy account");
            helper.setFrom(sender, senderName);
            helper.setReplyTo(sender, senderName);

            MimeMultipart alternatives = new MimeMultipart("alternative");
            MimeBodyPart plainText = new MimeBodyPart();
            plainText.setText(getPlainTextTemplate(verificationCode), StandardCharsets.UTF_8.name());
            alternatives.addBodyPart(plainText);

            MimeBodyPart html = new MimeBodyPart();
            html.setContent(getHtmlTemplate(verificationCode), "text/html; charset=UTF-8");
            alternatives.addBodyPart(html);
            message.setContent(alternatives);

            message.setSentDate(new Date());
            message.setHeader("Auto-Submitted", "auto-generated");
            message.setHeader("X-Auto-Response-Suppress", "All");
            message.setHeader("Content-Language", "en-US");

            mailSender.send(message);
            logger.info("Verification email sent - recipient: {}, code: {}",
                email, maskVerificationCode(verificationCode));
        } catch (MessagingException exception) {
            logger.error("Verification email failed - recipient: {}, error: {}", email, exception.getMessage(), exception);
            throw exception;
        } catch (Exception exception) {
            logger.error("Verification email failed - recipient: {}, error: {}", email, exception.getMessage(), exception);
            throw new MessagingException("Email delivery failed.", exception);
        }
    }

    String getHtmlTemplate(String verificationCode) {
        return HTML_TEMPLATE.replace("{{CODE}}", verificationCode);
    }

    String getPlainTextTemplate(String verificationCode) {
        return """
            SAT-Buddy email verification

            Your verification code is: %s

            This code expires in 10 minutes. Enter it on the SAT-Buddy registration page.
            If you did not request this code, you can safely ignore this email.

            SAT-Buddy - By students, for students
            satbuddyteam@gmail.com
            """.formatted(verificationCode);
    }

    private String maskVerificationCode(String code) {
        if (code == null || code.length() <= 2) {
            return "***";
        }
        return code.substring(0, 1) + "***" + code.substring(code.length() - 1);
    }
}
