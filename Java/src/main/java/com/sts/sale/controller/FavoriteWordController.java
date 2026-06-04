package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.FavoriteWordRequest;
import com.sts.sale.dto.FavoriteWordResponse;
import com.sts.sale.service.FavoriteWordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://192.168.*.*:*"})
public class FavoriteWordController {
    
    @Autowired
    private FavoriteWordService favoriteWordService;
    
    /**
     * 添加收藏单词
     */
    @PostMapping("/add")
    public ApiResponse<FavoriteWordResponse> addFavoriteWord(
            @RequestBody FavoriteWordRequest request,
            HttpServletRequest httpRequest) {
        try {
            // 从请求中获取用户ID（假设从JWT token中解析）
            Long userId = getCurrentUserId(httpRequest);
            if (userId == null) {
                return ApiResponse.error(401, "用户未登录");
            }
            
            FavoriteWordResponse response = favoriteWordService.addFavoriteWord(userId, request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * 获取用户收藏的单词列表
     */
    @GetMapping("/list")
    public ApiResponse<List<FavoriteWordResponse>> getFavoriteWords(HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.error(401, "用户未登录");
            }
            
            List<FavoriteWordResponse> favoriteWords = favoriteWordService.getFavoriteWords(userId);
            return ApiResponse.success(favoriteWords);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * 删除收藏的单词
     */
    @DeleteMapping("/remove/{word}")
    public ApiResponse<Void> removeFavoriteWord(
            @PathVariable String word,
            HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.error(401, "用户未登录");
            }
            
            favoriteWordService.removeFavoriteWord(userId, word);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * 检查单词是否已收藏
     */
    @GetMapping("/check/{word}")
    public ApiResponse<Boolean> checkFavoriteStatus(
            @PathVariable String word,
            HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.error(401, "用户未登录");
            }
            
            boolean isFavorited = favoriteWordService.isWordFavorited(userId, word);
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
