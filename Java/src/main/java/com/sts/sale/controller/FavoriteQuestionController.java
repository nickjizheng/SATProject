package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.FavoriteQuestionRequest;
import com.sts.sale.dto.FavoriteQuestionResponse;
import com.sts.sale.security.AuthenticatedUserResolver;
import com.sts.sale.security.AuthenticatedUserResolver.AuthenticationRequiredException;
import com.sts.sale.security.AuthenticatedUserResolver.UserAccessDeniedException;
import com.sts.sale.service.FavoriteQuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/favorite-questions")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://192.168.*.*:*"})
public class FavoriteQuestionController {

    @Autowired
    private FavoriteQuestionService favoriteQuestionService;

    @Autowired
    private AuthenticatedUserResolver authenticatedUserResolver;

    /**
     * 添加收藏题目
     */
    @PostMapping("/add")
    public ApiResponse<FavoriteQuestionResponse> addFavoriteQuestion(
            @RequestBody FavoriteQuestionRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = authenticatedUserResolver.resolveRequiredLong(httpRequest);

            FavoriteQuestionResponse response = favoriteQuestionService.addFavoriteQuestion(userId, request);
            return ApiResponse.success(response);
        } catch (AuthenticationRequiredException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (UserAccessDeniedException e) {
            return ApiResponse.error(403, e.getMessage());
        } catch (IllegalStateException e) {
            return ApiResponse.error(409, e.getMessage());
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
            Long userId = authenticatedUserResolver.resolveRequiredLong(request);

            List<FavoriteQuestionResponse> favoriteQuestions = favoriteQuestionService.getFavoriteQuestions(userId);
            return ApiResponse.success(favoriteQuestions);
        } catch (AuthenticationRequiredException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (UserAccessDeniedException e) {
            return ApiResponse.error(403, e.getMessage());
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
            Long userId = authenticatedUserResolver.resolveRequiredLong(request);

            favoriteQuestionService.removeFavoriteQuestion(userId, questionId);
            return ApiResponse.success(null);
        } catch (AuthenticationRequiredException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (UserAccessDeniedException e) {
            return ApiResponse.error(403, e.getMessage());
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
            Long userId = authenticatedUserResolver.resolveRequiredLong(request);

            boolean isFavorited = favoriteQuestionService.isQuestionFavorited(userId, questionId);
            return ApiResponse.success(isFavorited);
        } catch (AuthenticationRequiredException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (UserAccessDeniedException e) {
            return ApiResponse.error(403, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
}
