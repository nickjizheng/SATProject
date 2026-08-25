package com.sts.sale.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Resolves account identity from the signed JWT. X-User-Id is accepted only as
 * a compatibility hint and must match the authenticated token exactly.
 */
@Component
public class AuthenticatedUserResolver {

    private final JwtUtil jwtUtil;

    public AuthenticatedUserResolver(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public Long resolveOptional(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        String userIdHeader = request.getHeader("X-User-Id");
        boolean hasAuthorization = authorization != null && !authorization.isBlank();
        boolean hasUserIdHeader = userIdHeader != null && !userIdHeader.isBlank();

        if (!hasAuthorization && !hasUserIdHeader) return null;
        if (!hasAuthorization) {
            throw new AuthenticationException("X-User-Id requires a valid bearer token.");
        }
        if (!authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new AuthenticationException("Authorization must use a bearer token.");
        }

        String token = authorization.substring(7).trim();
        if (token.isEmpty()) {
            throw new AuthenticationException("Bearer token is missing.");
        }

        final Long tokenUserId;
        try {
            String username = jwtUtil.extractUsername(token);
            if (!Boolean.TRUE.equals(jwtUtil.validateToken(token, username))) {
                throw new AuthenticationException("The bearer token is invalid or expired.");
            }
            tokenUserId = jwtUtil.getUserIdFromToken(token);
        } catch (AuthenticationException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new AuthenticationException("The bearer token is invalid or expired.");
        }

        if (tokenUserId == null || tokenUserId <= 0) {
            throw new AuthenticationException("The bearer token has no valid user identity.");
        }
        if (hasUserIdHeader) {
            Long headerUserId = parseUserId(userIdHeader);
            if (!tokenUserId.equals(headerUserId)) {
                throw new AuthenticationException("X-User-Id does not match the authenticated user.");
            }
        }
        return tokenUserId;
    }

    public Long resolveRequired(HttpServletRequest request) {
        Long userId = resolveOptional(request);
        if (userId == null) {
            throw new AuthenticationException("Sign in is required.");
        }
        return userId;
    }

    public Integer resolveOptionalInteger(HttpServletRequest request) {
        Long userId = resolveOptional(request);
        if (userId == null) return null;
        try {
            return Math.toIntExact(userId);
        } catch (ArithmeticException e) {
            throw new AuthenticationException("The authenticated user ID is out of range.");
        }
    }

    private Long parseUserId(String value) {
        try {
            long parsed = Long.parseLong(value.trim());
            if (parsed <= 0) throw new NumberFormatException("non-positive");
            return parsed;
        } catch (NumberFormatException e) {
            throw new AuthenticationException("X-User-Id must be a positive integer.");
        }
    }

    public static class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) {
            super(message);
        }
    }
}
