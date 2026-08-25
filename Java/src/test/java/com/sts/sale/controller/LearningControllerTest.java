package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.LearningProfileResponse;
import com.sts.sale.dto.ReadinessResponse;
import com.sts.sale.service.LearningService;
import com.sts.sale.utils.AuthenticatedUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.assertEquals;
class LearningControllerTest {

    private HttpServletRequest request;
    private StubLearningService learningService;
    private StubUserResolver userResolver;
    private LearningController controller;

    @BeforeEach
    void setUp() {
        request = Mockito.mock(HttpServletRequest.class);
        learningService = new StubLearningService();
        userResolver = new StubUserResolver();
        controller = new LearningController(learningService, userResolver);
    }

    @Test
    void authenticationFailureIsReturnedInTheStandardEnvelope() {
        userResolver.failure = new AuthenticatedUserResolver.AuthenticationException(
            "Sign in is required.");

        ApiResponse<ReadinessResponse> response = controller.getReadiness(request);

        assertEquals(401, response.getCode());
        assertEquals("Sign in is required.", response.getMessage());
        assertEquals(0, learningService.readinessCalls);
    }

    @Test
    void authenticatedIdentityComesFromResolverRatherThanRequestData() {
        LearningProfileResponse profile = new LearningProfileResponse();
        userResolver.userId = 7L;
        learningService.profile = profile;

        ApiResponse<LearningProfileResponse> response = controller.getProfile(request);

        assertEquals(200, response.getCode());
        assertEquals(profile, response.getData());
        assertEquals(7L, learningService.lastProfileUserId);
    }

    private static class StubLearningService extends LearningService {
        private int readinessCalls;
        private Long lastProfileUserId;
        private LearningProfileResponse profile;

        StubLearningService() {
            super(null, null);
        }

        @Override
        public ReadinessResponse getReadiness(Long userId) {
            readinessCalls += 1;
            return new ReadinessResponse();
        }

        @Override
        public LearningProfileResponse getProfile(Long userId) {
            lastProfileUserId = userId;
            return profile;
        }
    }

    private static class StubUserResolver extends AuthenticatedUserResolver {
        private Long userId;
        private RuntimeException failure;

        StubUserResolver() {
            super(null);
        }

        @Override
        public Long resolveRequired(HttpServletRequest request) {
            if (failure != null) throw failure;
            return userId;
        }
    }
}
