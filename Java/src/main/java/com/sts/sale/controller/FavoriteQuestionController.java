package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.FavoriteQuestionRequest;
import com.sts.sale.dto.FavoriteQuestionResponse;
import com.sts.sale.service.FavoriteQuestionService;
import com.sts.sale.utils.AuthenticatedUserResolver;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/favorite-questions")
public class FavoriteQuestionController {

    private final FavoriteQuestionService favoriteQuestionService;
    private final AuthenticatedUserResolver userResolver;

    public FavoriteQuestionController(FavoriteQuestionService favoriteQuestionService,
                                      AuthenticatedUserResolver userResolver) {
        this.favoriteQuestionService = favoriteQuestionService;
        this.userResolver = userResolver;
    }
    
    /**
     * 添加收藏题目
     */
    @PostMapping("/add")
    public ApiResponse<FavoriteQuestionResponse> addFavoriteQuestion(
            @RequestBody FavoriteQuestionRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = userResolver.resolveRequired(httpRequest);
            FavoriteQuestionResponse response = favoriteQuestionService.addFavoriteQuestion(userId, request);
            return ApiResponse.success(response);
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * 获取用户收藏的题目列表
     */
    @GetMapping("/list")
    public ApiResponse<List<FavoriteQuestionResponse>> getFavoriteQuestions(HttpServletRequest request) {
        try {
            Long userId = userResolver.resolveRequired(request);
            List<FavoriteQuestionResponse> favoriteQuestions = favoriteQuestionService.getFavoriteQuestions(userId);
            return ApiResponse.success(favoriteQuestions);
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * 删除收藏的题目
     */
    @DeleteMapping("/remove/{questionId}")
    public ApiResponse<Void> removeFavoriteQuestion(
            @PathVariable Long questionId,
            HttpServletRequest request) {
        try {
            Long userId = userResolver.resolveRequired(request);
            favoriteQuestionService.removeFavoriteQuestion(userId, questionId);
            return ApiResponse.success(null);
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * 检查题目是否已收藏
     */
    @GetMapping("/check/{questionId}")
    public ApiResponse<Boolean> checkFavoriteStatus(
            @PathVariable Long questionId,
            HttpServletRequest request) {
        try {
            Long userId = userResolver.resolveRequired(request);
            boolean isFavorited = favoriteQuestionService.isQuestionFavorited(userId, questionId);
            return ApiResponse.success(isFavorited);
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
}
