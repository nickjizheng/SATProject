package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.FavoriteQuestionRequest;
import com.sts.sale.dto.FavoriteQuestionResponse;
import com.sts.sale.dto.FavoriteWordRequest;
import com.sts.sale.dto.FavoriteWordResponse;
import com.sts.sale.service.FavoriteQuestionService;
import com.sts.sale.service.FavoriteWordService;
import com.sts.sale.utils.AuthenticatedUserResolver;
import com.sts.sale.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

class FavoriteControllerAuthenticationTest {

    private static final String TEST_SECRET =
        "favorite-controller-test-secret-with-at-least-32-bytes";

    private AuthenticatedUserResolver userResolver;
    private RecordingFavoriteQuestionService questionService;
    private RecordingFavoriteWordService wordService;

    @BeforeEach
    void setUp() {
        userResolver = new AuthenticatedUserResolver(new JwtUtil(TEST_SECRET));
        questionService = new RecordingFavoriteQuestionService();
        wordService = new RecordingFavoriteWordService();
    }

    @Test
    void spoofedQuestionUserHeaderWithoutJwtCannotReadWriteRemoveOrCheck() {
        FavoriteQuestionController controller =
            new FavoriteQuestionController(questionService, userResolver);
        HttpServletRequest request = spoofedHeaderOnlyRequest();

        ApiResponse<FavoriteQuestionResponse> add = controller.addFavoriteQuestion(
            new FavoriteQuestionRequest(), request);
        ApiResponse<List<FavoriteQuestionResponse>> list =
            controller.getFavoriteQuestions(request);
        ApiResponse<Void> remove = controller.removeFavoriteQuestion(42L, request);
        ApiResponse<Boolean> check = controller.checkFavoriteStatus(42L, request);

        assertEquals(401, add.getCode());
        assertEquals(401, list.getCode());
        assertEquals(401, remove.getCode());
        assertEquals(401, check.getCode());
        assertEquals(0, questionService.calls);
    }

    @Test
    void everyQuestionFavoriteOperationUsesTheJwtDerivedUserId() {
        FavoriteQuestionController controller =
            new FavoriteQuestionController(questionService, userResolver);
        HttpServletRequest request = authenticatedRequest(7L);

        assertEquals(200, controller.addFavoriteQuestion(
            new FavoriteQuestionRequest(), request).getCode());
        assertEquals(200, controller.getFavoriteQuestions(request).getCode());
        assertEquals(200, controller.removeFavoriteQuestion(42L, request).getCode());
        assertEquals(200, controller.checkFavoriteStatus(42L, request).getCode());

        assertEquals(List.of(7L, 7L, 7L, 7L), questionService.userIds);
    }

    @Test
    void spoofedWordUserHeaderWithoutJwtCannotReadWriteRemoveOrCheck() {
        FavoriteWordController controller =
            new FavoriteWordController(wordService, userResolver);
        HttpServletRequest request = spoofedHeaderOnlyRequest();

        ApiResponse<FavoriteWordResponse> add = controller.addFavoriteWord(
            new FavoriteWordRequest(), request);
        ApiResponse<List<FavoriteWordResponse>> list = controller.getFavoriteWords(request);
        ApiResponse<Void> remove = controller.removeFavoriteWord("lucid", request);
        ApiResponse<Boolean> check = controller.checkFavoriteStatus("lucid", request);

        assertEquals(401, add.getCode());
        assertEquals(401, list.getCode());
        assertEquals(401, remove.getCode());
        assertEquals(401, check.getCode());
        assertEquals(0, wordService.calls);
    }

    @Test
    void everyWordFavoriteOperationUsesTheJwtDerivedUserId() {
        FavoriteWordController controller =
            new FavoriteWordController(wordService, userResolver);
        HttpServletRequest request = authenticatedRequest(11L);

        assertEquals(200, controller.addFavoriteWord(
            new FavoriteWordRequest(), request).getCode());
        assertEquals(200, controller.getFavoriteWords(request).getCode());
        assertEquals(200, controller.removeFavoriteWord("lucid", request).getCode());
        assertEquals(200, controller.checkFavoriteStatus("lucid", request).getCode());

        assertEquals(List.of(11L, 11L, 11L, 11L), wordService.userIds);
    }

    private HttpServletRequest spoofedHeaderOnlyRequest() {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getHeader("X-User-Id")).thenReturn("999");
        return request;
    }

    private HttpServletRequest authenticatedRequest(Long userId) {
        JwtUtil jwtUtil = new JwtUtil(TEST_SECRET);
        String token = jwtUtil.generateToken("student", userId);
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(request.getHeader("X-User-Id")).thenReturn(null);
        return request;
    }

    private static class RecordingFavoriteQuestionService extends FavoriteQuestionService {
        private int calls;
        private final List<Long> userIds = new java.util.ArrayList<>();

        @Override
        public FavoriteQuestionResponse addFavoriteQuestion(
                Long userId, FavoriteQuestionRequest request) {
            record(userId);
            return new FavoriteQuestionResponse();
        }

        @Override
        public List<FavoriteQuestionResponse> getFavoriteQuestions(Long userId) {
            record(userId);
            return List.of();
        }

        @Override
        public void removeFavoriteQuestion(Long userId, Long questionId) {
            record(userId);
        }

        @Override
        public boolean isQuestionFavorited(Long userId, Long questionId) {
            record(userId);
            return true;
        }

        private void record(Long userId) {
            calls += 1;
            userIds.add(userId);
        }
    }

    private static class RecordingFavoriteWordService extends FavoriteWordService {
        private int calls;
        private final List<Long> userIds = new java.util.ArrayList<>();

        @Override
        public FavoriteWordResponse addFavoriteWord(
                Long userId, FavoriteWordRequest request) {
            record(userId);
            return new FavoriteWordResponse();
        }

        @Override
        public List<FavoriteWordResponse> getFavoriteWords(Long userId) {
            record(userId);
            return List.of();
        }

        @Override
        public void removeFavoriteWord(Long userId, String word) {
            record(userId);
        }

        @Override
        public boolean isWordFavorited(Long userId, String word) {
            record(userId);
            return true;
        }

        private void record(Long userId) {
            calls += 1;
            userIds.add(userId);
        }
    }
}
