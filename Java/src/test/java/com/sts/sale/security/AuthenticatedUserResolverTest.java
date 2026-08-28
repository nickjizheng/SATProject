package com.sts.sale.security;

import com.sts.sale.security.AuthenticatedUserResolver.AuthenticationRequiredException;
import com.sts.sale.security.AuthenticatedUserResolver.UserAccessDeniedException;
import com.sts.sale.utils.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthenticatedUserResolverTest {

    private AuthenticatedUserResolver resolver;
    private String token;

    @BeforeEach
    void setUp() {
        JwtUtil jwtUtil = new JwtUtil("test-only-secret-that-is-at-least-thirty-two-bytes");
        resolver = new AuthenticatedUserResolver(jwtUtil);
        token = jwtUtil.generateToken("student-a", 17L);
    }

    @Test
    void resolvesUserIdFromValidBearerToken() {
        MockHttpServletRequest request = requestWithBearerToken();

        assertEquals(17L, resolver.resolveRequiredLong(request));
    }

    @Test
    void acceptsMatchingLegacyUserIdOnlyAsConsistencyCheck() {
        MockHttpServletRequest request = requestWithBearerToken();
        request.addHeader("X-User-Id", "17");

        assertEquals(17, resolver.resolveOptionalInteger(request));
    }

    @Test
    void acceptsCaseInsensitiveBearerScheme() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "bearer " + token);

        assertEquals(17L, resolver.resolveRequiredLong(request));
    }

    @Test
    void rejectsBareUserIdWithoutBearerToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-User-Id", "17");

        assertThrows(AuthenticationRequiredException.class,
                () -> resolver.resolveOptionalInteger(request));
    }

    @Test
    void rejectsUserIdThatDoesNotMatchBearerToken() {
        MockHttpServletRequest request = requestWithBearerToken();
        request.addHeader("X-User-Id", "18");

        assertThrows(UserAccessDeniedException.class,
                () -> resolver.resolveRequiredLong(request));
    }

    @Test
    void rejectsInvalidBearerToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer not-a-valid-token");

        assertThrows(AuthenticationRequiredException.class,
                () -> resolver.resolveRequiredLong(request));
    }

    @Test
    void preservesAnonymousPracticeWhenNoIdentityIsClaimed() {
        assertNull(resolver.resolveOptionalInteger(new MockHttpServletRequest()));
    }

    private MockHttpServletRequest requestWithBearerToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
}
