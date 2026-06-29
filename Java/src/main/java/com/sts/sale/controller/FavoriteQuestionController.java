package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.FavoriteQuestionRequest;
import com.sts.sale.dto.FavoriteQuestionResponse;
import com.sts.sale.service.FavoriteQuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/favorite-questions")
public class FavoriteQuestionController {
    
    @Autowired
    private FavoriteQuestionService favoriteQuestionService;
    
    /**
     * 添加收藏题目
     */
    @PostMapping("/add")
    public ApiResponse<FavoriteQuestionResponse> addFavoriteQuestion(
            @RequestBody FavoriteQuestionRequest request,
            HttpServletRequest httpRequest) {
        try {
            // 从请求中获取用户ID（假设从JWT token中解析）
            Long userId = getCurrentUserId(httpRequest);
            if (userId == null) {
                return ApiResponse.error(401, "用户未登录");
            }
            
            FavoriteQuestionResponse response = favoriteQuestionService.addFavoriteQuestion(userId, request);
            return ApiResponse.success(response);
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
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.error(401, "用户未登录");
            }
            
            List<FavoriteQuestionResponse> favoriteQuestions = favoriteQuestionService.getFavoriteQuestions(userId);
            return ApiResponse.success(favoriteQuestions);
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
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.error(401, "用户未登录");
            }
            
            favoriteQuestionService.removeFavoriteQuestion(userId, questionId);
            return ApiResponse.success(null);
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
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.error(401, "用户未登录");
            }
            
            boolean isFavorited = favoriteQuestionService.isQuestionFavorited(userId, questionId);
            return ApiResponse.success(isFavorited);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * 从请求中获取当前用户ID
     * 这里需要根据你的JWT实现来修改
     */
    private Long getCurrentUserId(HttpServletRequest request) {
        // 这里应该从JWT token中解析用户ID
        // 暂时返回一个模拟的用户ID，实际使用时需要替换
        String userIdStr = request.getHeader("X-User-Id");
        if (userIdStr != null) {
            try {
                return Long.parseLong(userIdStr);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
