package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.service.DashboardService;
import com.sts.sale.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 仪表盘控制器
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 获取用户学习统计
     * @param userId 用户ID
     * @return 用户统计数据
     */
    @GetMapping(value = "/stats", produces = "application/json")
    public ApiResponse<Object> getUserStats(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        try {
            Integer userIdInt = getAuthenticatedUserId(authorization, userId);
            Object stats = dashboardService.getUserStats(userIdInt);
            return ApiResponse.success("获取用户统计成功", stats);
        } catch (SecurityException e) {
            return ApiResponse.error(403, "Access denied.");
        } catch (Exception e) {
            return ApiResponse.error(401, "Access denied. Please log in.");
        }
    }

    /**
     * 获取用户最近活动
     * @param userId 用户ID
     * @param limit 限制数量
     * @return 最近活动列表
     */
    @GetMapping(value = "/activities", produces = "application/json")
    public ApiResponse<List<Map<String, Object>>> getRecentActivities(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            Integer userIdInt = getAuthenticatedUserId(authorization, userId);
            List<Map<String, Object>> activities = dashboardService.getRecentActivities(userIdInt, limit);
            return ApiResponse.success("获取最近活动成功", activities);
        } catch (SecurityException e) {
            return ApiResponse.error(403, "Access denied.");
        } catch (Exception e) {
            return ApiResponse.error(401, "Access denied. Please log in.");
        }
    }

    /**
     * 获取用户学习进度
     * @param userId 用户ID
     * @param days 天数
     * @return 学习进度数据
     */
    @GetMapping(value = "/progress", produces = "application/json")
    public ApiResponse<List<Map<String, Object>>> getStudyProgress(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam(defaultValue = "7") int days) {
        try {
            Integer userIdInt = getAuthenticatedUserId(authorization, userId);
            List<Map<String, Object>> progress = dashboardService.getStudyProgress(userIdInt, days);
            return ApiResponse.success("获取学习进度成功", progress);
        } catch (SecurityException e) {
            return ApiResponse.error(403, "Access denied.");
        } catch (Exception e) {
            return ApiResponse.error(401, "Access denied. Please log in.");
        }
    }

    private Integer getAuthenticatedUserId(String authorization, String requestedUserId) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing bearer token");
        }

        String token = authorization.substring(7);
        String username = jwtUtil.extractUsername(token);
        if (!jwtUtil.validateToken(token, username)) {
            throw new IllegalArgumentException("Invalid bearer token");
        }

        Integer tokenUserId = Math.toIntExact(jwtUtil.extractUserId(token));
        if (requestedUserId != null && !requestedUserId.trim().isEmpty()
                && !tokenUserId.equals(Integer.valueOf(requestedUserId))) {
            throw new SecurityException("User ID does not match token");
        }

        return tokenUserId;
    }
}
