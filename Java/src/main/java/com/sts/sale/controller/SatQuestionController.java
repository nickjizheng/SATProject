package com.sts.sale.controller;

import com.sts.sale.dto.*;
import com.sts.sale.service.SatQuestionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SAT题目控制器
 */
@RestController
@RequestMapping("/api/sat")
public class SatQuestionController {

    @Autowired
    private SatQuestionService satQuestionService;

    /**
     * 获取随机题目
     * @param count 题目数量，默认10道
     * @return 题目列表
     */
    @GetMapping(value = "/questions/random", produces = "application/json")
    public ApiResponse<List<SatQuestionResponse>> getRandomQuestions(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(defaultValue = "10") int count) {
        try {
            Integer userId = parseOptionalUserId(userIdHeader);
            List<SatQuestionResponse> questions = satQuestionService.getRandomQuestions(count, userId);
            return ApiResponse.success("获取题目成功", questions);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取题目失败: " + e.getMessage());
        }
    }

    /**
     * 根据领域获取题目
     * @param domain 题目领域
     * @param count 题目数量，默认10道
     * @return 题目列表
     */
    @GetMapping(value = "/questions/domain/{domain}", produces = "application/json")
    public ApiResponse<List<SatQuestionResponse>> getQuestionsByDomain(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @PathVariable String domain,
            @RequestParam(defaultValue = "10") int count) {
        try {
            Integer userId = parseOptionalUserId(userIdHeader);
            List<SatQuestionResponse> questions = satQuestionService.getQuestionsByDomain(domain, count, userId);
            return ApiResponse.success("获取题目成功", questions);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取题目失败: " + e.getMessage());
        }
    }

    /**
     * 获取所有领域
     * @return 领域列表
     */
    @GetMapping(value = "/domains", produces = "application/json")
    public ApiResponse<List<String>> getAllDomains() {
        try {
            List<String> domains = satQuestionService.getAllDomains();
            return ApiResponse.success("获取领域成功", domains);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取领域失败: " + e.getMessage());
        }
    }

    /**
     * 根据ID获取题目
     * @param id 题目ID
     * @return 题目详情
     */
    @GetMapping(value = "/questions/{id}", produces = "application/json")
    public ApiResponse<SatQuestionResponse> getQuestionById(@PathVariable Integer id) {
        try {
            SatQuestionResponse question = satQuestionService.getQuestionById(id);
            if (question == null) {
                return ApiResponse.error("题目不存在");
            }
            return ApiResponse.success("获取题目成功", question);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取题目失败: " + e.getMessage());
        }
    }

    /**
     * 提交答案
     * @param request 答题请求
     * @return 答题结果
     */
    @PostMapping(value = "/answer", produces = "application/json")
    public ApiResponse<AnswerResponse> submitAnswer(@Valid @RequestBody AnswerRequest request) {
        try {
            AnswerResponse response = satQuestionService.checkAnswer(request);
            return ApiResponse.success("答题完成", response);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("答题失败: " + e.getMessage());
        }
    }

    /**
     * 获取下一道未做过的题目
     * @param request 请求参数
     * @return 下一题响应
     */
    @PostMapping(value = "/next-question", produces = "application/json")
    public ApiResponse<NextQuestionResponse> getNextQuestion(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody NextQuestionRequest request) {
        try {
            Integer userId = parseOptionalUserId(userIdHeader);
            NextQuestionResponse response = satQuestionService.getNextQuestion(request, userId);
            return ApiResponse.success("获取题目成功", response);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取题目失败: " + e.getMessage());
        }
    }

    /**
     * 提交答案并记录
     * @param request 答题请求
     * @param httpRequest HTTP请求对象
     * @return 答题结果
     */
    @PostMapping(value = "/submit-answer", produces = "application/json")
    public ApiResponse<AnswerResponse> submitAnswerWithRecord(
            @Valid @RequestBody AnswerRequest request,
            HttpServletRequest httpRequest) {
        try {
            Integer userId = parseOptionalUserId(httpRequest.getHeader("X-User-Id"));
            AnswerResponse response = satQuestionService.submitAnswerWithRecord(request, userId);
            return ApiResponse.success("答题完成", response);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("答题失败: " + e.getMessage());
        }
    }

    /**
     * Retrieves the latest persisted attempt for a question.
     */
    @GetMapping(value = "/answer-record/{questionId}", produces = "application/json")
    public ApiResponse<AnswerResponse> getRecordedAnswer(
            @PathVariable Integer questionId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(required = false) String sessionId) {
        try {
            Integer userId = parseOptionalUserId(userIdHeader);
            AnswerResponse response = satQuestionService.getRecordedAnswer(questionId, userId, sessionId);
            return ApiResponse.success("答题记录获取成功", response);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("答题记录获取失败: " + e.getMessage());
        }
    }

    /**
     * 生成新的会话ID
     * @return 会话ID
     */
    @PostMapping(value = "/session", produces = "application/json")
    public ApiResponse<String> generateSession() {
        try {
            String sessionId = satQuestionService.generateSessionId();
            return ApiResponse.success("会话创建成功", sessionId);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("创建会话失败: " + e.getMessage());
        }
    }

    private Integer parseOptionalUserId(String userIdHeader) {
        if (userIdHeader == null || userIdHeader.trim().isEmpty()) {
            return null;
        }

        try {
            return Integer.parseInt(userIdHeader);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("用户ID格式错误");
        }
    }
}
