package com.sts.sale.controller;

import com.sts.sale.dto.AnswerRequest;
import com.sts.sale.dto.AnswerResponse;
import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.GuestAnswerRequest;
import com.sts.sale.service.SatQuestionService;
import com.sts.sale.utils.AuthenticatedUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SatQuestionControllerTest {

    private StubSatQuestionService service;

    @BeforeEach
    void setUp() {
        service = new StubSatQuestionService();
    }

    @Test
    void guestCheckHasNoAuthenticationDependencyAndUsesOnlyMinimalPayload() {
        SatQuestionController controller = new SatQuestionController(service, null);
        GuestAnswerRequest request = new GuestAnswerRequest();
        request.setQuestionId(42);
        request.setAnswer("A");

        ApiResponse<AnswerResponse> response = controller.checkGuestAnswer(request);

        assertEquals(200, response.getCode());
        assertEquals(42, service.checkedQuestionId);
        assertEquals("A", service.checkedAnswer);
        assertEquals(false, response.getData().getIsCorrect());
    }

    @Test
    void publicDomainRetrievalDoesNotRequireAuthentication() {
        SatQuestionController controller = new SatQuestionController(service, null);
        service.domains = List.of("Advanced Math");

        ApiResponse<List<String>> response = controller.getAllDomains();

        assertEquals(200, response.getCode());
        assertEquals(service.domains, response.getData());
    }

    @Test
    void recordingEndpointRequiresAuthenticatedIdentityBeforeCallingService() {
        StubUserResolver resolver = new StubUserResolver();
        resolver.failure = new AuthenticatedUserResolver.AuthenticationException(
            "Sign in is required.");
        SatQuestionController controller = new SatQuestionController(service, resolver);

        AnswerRequest request = new AnswerRequest();
        request.setQuestionId(42);
        request.setAnswer("A");
        ApiResponse<AnswerResponse> response =
            controller.submitAnswerWithRecord(request, null);

        assertEquals(401, response.getCode());
        assertEquals(0, service.recordingCalls);
    }

    @Test
    void savedAttemptLookupRequiresAuthenticatedIdentityBeforeCallingService() {
        StubUserResolver resolver = new StubUserResolver();
        resolver.failure = new AuthenticatedUserResolver.AuthenticationException(
            "Sign in is required.");
        SatQuestionController controller = new SatQuestionController(service, resolver);

        ApiResponse<AnswerResponse> response =
            controller.getRecordedAnswer(42, "session-1", null);

        assertEquals(401, response.getCode());
        assertEquals(0, service.historyCalls);
    }

    private static class StubSatQuestionService extends SatQuestionService {
        private Integer checkedQuestionId;
        private String checkedAnswer;
        private int recordingCalls;
        private int historyCalls;
        private List<String> domains = List.of();

        StubSatQuestionService() {
            super(null, null, null, null, null);
        }

        @Override
        public AnswerResponse checkAnswer(Integer questionId, String answer) {
            checkedQuestionId = questionId;
            checkedAnswer = answer;
            AnswerResponse response = new AnswerResponse();
            response.setQuestionId(questionId);
            response.setUserAnswer(answer);
            response.setCorrectAnswer("B");
            response.setIsCorrect("B".equals(answer));
            response.setExplanation("Provided explanation.");
            return response;
        }

        @Override
        public List<String> getAllDomains() {
            return domains;
        }

        @Override
        public AnswerResponse submitAnswerWithRecord(AnswerRequest request, Long userId) {
            recordingCalls += 1;
            return new AnswerResponse();
        }

        @Override
        public AnswerResponse getRecordedAnswer(Integer questionId, Long userId, String sessionId) {
            historyCalls += 1;
            return new AnswerResponse();
        }
    }

    private static class StubUserResolver extends AuthenticatedUserResolver {
        private RuntimeException failure;

        StubUserResolver() {
            super(null);
        }

        @Override
        public Long resolveRequired(HttpServletRequest request) {
            if (failure != null) throw failure;
            return 7L;
        }
    }
}
