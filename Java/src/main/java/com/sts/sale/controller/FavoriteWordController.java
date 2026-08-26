package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.FavoriteWordRequest;
import com.sts.sale.dto.FavoriteWordResponse;
import com.sts.sale.service.FavoriteWordService;
import com.sts.sale.utils.AuthenticatedUserResolver;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteWordController {

    private final FavoriteWordService favoriteWordService;
    private final AuthenticatedUserResolver userResolver;

    public FavoriteWordController(FavoriteWordService favoriteWordService,
                                  AuthenticatedUserResolver userResolver) {
        this.favoriteWordService = favoriteWordService;
        this.userResolver = userResolver;
    }
    
    /**
     * 添加收藏单词
     */
    @PostMapping("/add")
    public ApiResponse<FavoriteWordResponse> addFavoriteWord(
            @RequestBody FavoriteWordRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = userResolver.resolveRequired(httpRequest);
            FavoriteWordResponse response = favoriteWordService.addFavoriteWord(userId, request);
            return ApiResponse.success(response);
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
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
            Long userId = userResolver.resolveRequired(request);
            List<FavoriteWordResponse> favoriteWords = favoriteWordService.getFavoriteWords(userId);
            return ApiResponse.success(favoriteWords);
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
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
            Long userId = userResolver.resolveRequired(request);
            favoriteWordService.removeFavoriteWord(userId, word);
            return ApiResponse.success(null);
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
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
            Long userId = userResolver.resolveRequired(request);
            boolean isFavorited = favoriteWordService.isWordFavorited(userId, word);
            return ApiResponse.success(isFavorited);
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
}
