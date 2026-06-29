package com.sts.sale.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    // 使用固定的密钥，避免每次重启都生成新密钥
    private static final String SECRET_STRING = "mySecretKeyForJWTTokenGeneration123456789012345678901234567890";
    private static final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24小时
    private static final long REFRESH_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7天

    public String generateToken(String username, Long userId) {
        //generate token for the user
        Map<String, Object> claims = new HashMap<>();
        //userid added
        claims.put("userId", userId);
        //create token
        return createToken(claims, username, EXPIRATION_TIME);
    }

    public String generateRefreshToken(String username, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        return createToken(claims, username, REFRESH_EXPIRATION_TIME);
    }

    private String createToken(Map<String, Object> claims, String subject, long expiration) {
        return Jwts.builder()
                .setClaims(claims)
                // Set token owner.
                .setSubject(subject)
                // Set creation time.
                .setIssuedAt(new Date(System.currentTimeMillis()))
                // Set expiry time.
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                // Sign token securely.
                .signWith(SECRET_KEY)
                // Build token string.
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", Long.class);
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (username.equals(extractedUsername) && !isTokenExpired(token));
    }

    public Long getUserIdFromToken(String token) {
        return extractUserId(token);
    }
}
