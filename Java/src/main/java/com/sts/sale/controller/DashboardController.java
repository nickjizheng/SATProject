package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.service.DashboardService;
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
    
    /**
     * 获取用户学习统计
     * @param userId 用户ID
     * @return 用户统计数据
     */
    @GetMapping(value = "/stats", produces = "application/json")
    public ApiResponse<Object> getUserStats(@RequestHeader("X-User-Id") String userId) {
        try {
            Integer userIdInt = Integer.parseInt(userId);
            Object stats = dashboardService.getUserStats(userIdInt);
            return ApiResponse.success("获取用户统计成功", stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取用户统计失败: " + e.getMessage());
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
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            Integer userIdInt = Integer.parseInt(userId);
            List<Map<String, Object>> activities = dashboardService.getRecentActivities(userIdInt, limit);
            return ApiResponse.success("获取最近活动成功", activities);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取最近活动失败: " + e.getMessage());
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
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "7") int days) {
        try {
            Integer userIdInt = Integer.parseInt(userId);
            List<Map<String, Object>> progress = dashboardService.getStudyProgress(userIdInt, days);
            return ApiResponse.success("获取学习进度成功", progress);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取学习进度失败: " + e.getMessage());
        }
    }
}
