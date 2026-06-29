package com.sts.sale.utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordUtil {

    //password encode
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    //encrypt password
    public String encode(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    // check passwords
    public boolean matches(String rawPassword, String encodedPassword) {
        return encoder.matches(rawPassword, encodedPassword);
    }
}
