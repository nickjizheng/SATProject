package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.FavoriteWordRequest;
import com.sts.sale.dto.FavoriteWordResponse;
import com.sts.sale.security.AuthenticatedUserResolver;
import com.sts.sale.security.AuthenticatedUserResolver.AuthenticationRequiredException;
import com.sts.sale.security.AuthenticatedUserResolver.UserAccessDeniedException;
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

    @Autowired
    private AuthenticatedUserResolver authenticatedUserResolver;

    /**
     * 添加收藏单词
     */
    @PostMapping("/add")
    public ApiResponse<FavoriteWordResponse> addFavoriteWord(
            @RequestBody FavoriteWordRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = authenticatedUserResolver.resolveRequiredLong(httpRequest);

            FavoriteWordResponse response = favoriteWordService.addFavoriteWord(userId, request);
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
     * 获取用户收藏的单词列表
     */
    @GetMapping("/list")
    public ApiResponse<List<FavoriteWordResponse>> getFavoriteWords(HttpServletRequest request) {
        try {
            Long userId = authenticatedUserResolver.resolveRequiredLong(request);

            List<FavoriteWordResponse> favoriteWords = favoriteWordService.getFavoriteWords(userId);
            return ApiResponse.success(favoriteWords);
        } catch (AuthenticationRequiredException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (UserAccessDeniedException e) {
            return ApiResponse.error(403, e.getMessage());
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
            Long userId = authenticatedUserResolver.resolveRequiredLong(request);

            favoriteWordService.removeFavoriteWord(userId, word);
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
     * 检查单词是否已收藏
     */
    @GetMapping("/check/{word}")
    public ApiResponse<Boolean> checkFavoriteStatus(
            @PathVariable String word,
            HttpServletRequest request) {
        try {
            Long userId = authenticatedUserResolver.resolveRequiredLong(request);

            boolean isFavorited = favoriteWordService.isWordFavorited(userId, word);
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
