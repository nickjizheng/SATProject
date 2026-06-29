package com.sts.sale.service;

import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailServiceTest {

    private final EmailService emailService = new EmailService();

    @Test
    void htmlTemplateUsesSatBuddyBrandAndVerificationDetails() {
        String html = emailService.getHtmlTemplate("482731");

        assertTrue(html.contains("SAT-Buddy"));
        assertTrue(html.contains("482731"));
        assertTrue(html.contains("10 minutes"));
        assertTrue(html.contains("satbuddyteam@gmail.com"));
        assertFalse(html.contains("FoodSale"));
    }

    @Test
    void plainTextAlternativeContainsEssentialInformation() {
        String text = emailService.getPlainTextTemplate("482731");

        assertTrue(text.contains("SAT-Buddy"));
        assertTrue(text.contains("482731"));
        assertTrue(text.contains("10 minutes"));
    }

    @Test
    void sentMessageUsesBrandedIdentityAndTransactionalHeaders() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        ReflectionTestUtils.setField(emailService, "mailSender", mailSender);
        ReflectionTestUtils.setField(emailService, "sender", "satbuddyteam@gmail.com");
        ReflectionTestUtils.setField(emailService, "senderName", "SAT-Buddy");

        emailService.sendHtmlMail("student@example.com", "482731");
        message.saveChanges();

        InternetAddress from = (InternetAddress) message.getFrom()[0];
        assertEquals("satbuddyteam@gmail.com", from.getAddress());
        assertEquals("SAT-Buddy", from.getPersonal());
        assertEquals("Verify your SAT-Buddy account", message.getSubject());
        assertTrue(message.getContentType().startsWith("multipart/alternative"));
        assertEquals("auto-generated", message.getHeader("Auto-Submitted", null));
        assertEquals("All", message.getHeader("X-Auto-Response-Suppress", null));
        verify(mailSender).send(message);
    }
}
