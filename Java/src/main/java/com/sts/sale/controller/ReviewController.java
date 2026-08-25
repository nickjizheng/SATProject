package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.ReviewForecastDay;
import com.sts.sale.dto.ReviewGradeRequest;
import com.sts.sale.dto.ReviewQueueItem;
import com.sts.sale.dto.ReviewScheduleResponse;
import com.sts.sale.dto.ReviewSummary;
import com.sts.sale.service.ReviewService;
import com.sts.sale.utils.AuthenticatedUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/review")
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthenticatedUserResolver userResolver;

    public ReviewController(ReviewService reviewService, AuthenticatedUserResolver userResolver) {
        this.reviewService = reviewService;
        this.userResolver = userResolver;
    }

    @GetMapping(value = "/queue", produces = "application/json")
    public ApiResponse<List<ReviewQueueItem>> getQueue(
            HttpServletRequest httpRequest,
            @RequestParam(required = false) String domain,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            return ApiResponse.success(reviewService.getDueQueue(
                userResolver.resolveRequired(httpRequest), domain, limit));
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping(value = "/summary", produces = "application/json")
    public ApiResponse<ReviewSummary> getSummary(HttpServletRequest httpRequest) {
        try {
            return ApiResponse.success(reviewService.getSummary(
                userResolver.resolveRequired(httpRequest)));
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping(value = "/forecast", produces = "application/json")
    public ApiResponse<List<ReviewForecastDay>> getForecast(
            HttpServletRequest httpRequest,
            @RequestParam(defaultValue = "7") int days) {
        try {
            return ApiResponse.success(reviewService.getForecast(
                userResolver.resolveRequired(httpRequest), days));
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PostMapping(value = "/adjust", produces = "application/json")
    public ApiResponse<ReviewScheduleResponse> adjust(
            HttpServletRequest httpRequest,
            @Valid @RequestBody ReviewGradeRequest request) {
        try {
            return ApiResponse.success(reviewService.adjust(
                userResolver.resolveRequired(httpRequest), request));
        } catch (AuthenticatedUserResolver.AuthenticationException e) {
            return ApiResponse.error(401, e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
}
