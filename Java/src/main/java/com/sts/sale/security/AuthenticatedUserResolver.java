package com.sts.sale.security;

import com.sts.sale.utils.JwtUtil;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Resolves the current student from a signed JWT.
 *
 * <p>The optional {@code X-User-Id} header is treated only as a consistency
 * check for older clients. It is never accepted as authentication by itself.</p>
 */
@Component
public class AuthenticatedUserResolver {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtUtil jwtUtil;

    public AuthenticatedUserResolver(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public Long resolveRequiredLong(HttpServletRequest request) {
        Long userId = resolve(request, true);
        if (userId == null) {
            throw new AuthenticationRequiredException();
        }
        return userId;
    }

    public Integer resolveOptionalInteger(HttpServletRequest request) {
        Long userId = resolve(request, false);
        if (userId == null) {
            return null;
        }

        try {
            return Math.toIntExact(userId);
        } catch (ArithmeticException exception) {
            throw new AuthenticationRequiredException();
        }
    }

    private Long resolve(HttpServletRequest request, boolean required) {
        String authorization = trimToNull(request.getHeader("Authorization"));
        String requestedUserId = trimToNull(request.getHeader("X-User-Id"));

        if (authorization == null) {
            // A caller may remain anonymous, but a bare user ID must never grant access.
            if (requestedUserId != null || required) {
                throw new AuthenticationRequiredException();
            }
            return null;
        }

        if (!authorization.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            throw new AuthenticationRequiredException();
        }

        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            throw new AuthenticationRequiredException();
        }

        Long tokenUserId;
        try {
            String username = jwtUtil.extractUsername(token);
            tokenUserId = jwtUtil.extractUserId(token);
            if (username == null || username.isBlank() || tokenUserId == null
                    || !jwtUtil.validateToken(token, username)) {
                throw new AuthenticationRequiredException();
            }
        } catch (JwtException | IllegalArgumentException exception) {
            throw new AuthenticationRequiredException();
        }

        if (requestedUserId != null) {
            Long parsedRequestedUserId;
            try {
                parsedRequestedUserId = Long.valueOf(requestedUserId);
            } catch (NumberFormatException exception) {
                throw new UserAccessDeniedException();
            }

            if (!tokenUserId.equals(parsedRequestedUserId)) {
                throw new UserAccessDeniedException();
            }
        }

        return tokenUserId;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static class AuthenticationRequiredException extends RuntimeException {
        public AuthenticationRequiredException() {
            super("Authentication required. Please log in.");
        }
    }

    public static class UserAccessDeniedException extends RuntimeException {
        public UserAccessDeniedException() {
            super("Access denied: user ID does not match bearer token.");
        }
    }
}
