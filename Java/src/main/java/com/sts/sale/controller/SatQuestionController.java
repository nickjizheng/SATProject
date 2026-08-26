package com.sts.sale.controller;

import com.sts.sale.dto.AnswerRequest;
import com.sts.sale.dto.AnswerResponse;
import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.GuestAnswerRequest;
import com.sts.sale.dto.NextQuestionRequest;
import com.sts.sale.dto.NextQuestionResponse;
import com.sts.sale.dto.QuestionBankSummary;
import com.sts.sale.dto.SatQuestionResponse;
import com.sts.sale.service.SatQuestionService;
import com.sts.sale.utils.AuthenticatedUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public quality-gated practice and stateless scoring, with authenticated history. */
@RestController
@RequestMapping("/api/sat")
public class SatQuestionController {

    private final SatQuestionService satQuestionService;
    private final AuthenticatedUserResolver userResolver;

    public SatQuestionController(SatQuestionService satQuestionService,
                                 AuthenticatedUserResolver userResolver) {
        this.satQuestionService = satQuestionService;
        this.userResolver = userResolver;
    }

    @GetMapping(value = "/questions/random", produces = "application/json")
    public ApiResponse<List<SatQuestionResponse>> getRandomQuestions(
            HttpServletRequest httpRequest,
            @RequestParam(defaultValue = "10") int count) {
        try {
            return ApiResponse.success(
                "获取题目成功",
                satQuestionService.getRandomQuestions(
                    count, userResolver.resolveOptional(httpRequest))
            );
        } catch (Exception e) {
            return error(e, "获取题目失败");
        }
    }

    @GetMapping(value = "/questions/domain/{domain}", produces = "application/json")
    public ApiResponse<List<SatQuestionResponse>> getQuestionsByDomain(
            HttpServletRequest httpRequest,
            @PathVariable String domain,
            @RequestParam(defaultValue = "10") int count) {
        try {
            return ApiResponse.success(
                "获取题目成功",
                satQuestionService.getQuestionsByDomain(
                    domain, count, userResolver.resolveOptional(httpRequest))
            );
        } catch (Exception e) {
            return error(e, "获取题目失败");
        }
    }

    @GetMapping(value = "/domains", produces = "application/json")
    public ApiResponse<List<String>> getAllDomains() {
        try {
            return ApiResponse.success("获取领域成功", satQuestionService.getAllDomains());
        } catch (Exception e) {
            return error(e, "获取领域失败");
        }
    }

    @GetMapping(value = "/bank-summary", produces = "application/json")
    public ApiResponse<QuestionBankSummary> getQuestionBankSummary() {
        try {
            return ApiResponse.success(
                "题库质量概览获取成功",
                satQuestionService.getQuestionBankSummary()
            );
        } catch (Exception e) {
            return error(e, "题库质量概览获取失败");
        }
    }

    @GetMapping(value = "/questions/{id}", produces = "application/json")
    public ApiResponse<SatQuestionResponse> getQuestionById(@PathVariable Integer id) {
        try {
            SatQuestionResponse question = satQuestionService.getQuestionById(id);
            return question == null
                ? ApiResponse.error(404, "题目不存在或未通过质量筛选")
                : ApiResponse.success("获取题目成功", question);
        } catch (Exception e) {
            return error(e, "获取题目失败");
        }
    }

    /** Scores without persisting; a supplied identity header is still JWT-verified. */
    @PostMapping(value = "/answer", produces = "application/json")
    public ApiResponse<AnswerResponse> submitAnswer(
            @Valid @RequestBody AnswerRequest request,
            HttpServletRequest httpRequest) {
        try {
            userResolver.resolveOptional(httpRequest);
            return ApiResponse.success("答题完成", satQuestionService.checkAnswer(request));
        } catch (Exception e) {
            return error(e, "答题失败");
        }
    }

    /**
     * Stateless guest scoring. Identity, sessions, and client persistence fields
     * are intentionally absent from this contract, and no history is written.
     */
    @PostMapping(value = "/check-answer", produces = "application/json")
    public ApiResponse<AnswerResponse> checkGuestAnswer(
            @Valid @RequestBody GuestAnswerRequest request) {
        try {
            return ApiResponse.success(
                "答题完成",
                satQuestionService.checkAnswer(request.getQuestionId(), request.getAnswer())
            );
        } catch (Exception e) {
            return error(e, "答题失败");
        }
    }

    @PostMapping(value = "/next-question", produces = "application/json")
    public ApiResponse<NextQuestionResponse> getNextQuestion(
            @Valid @RequestBody NextQuestionRequest request,
            HttpServletRequest httpRequest) {
        try {
            return ApiResponse.success(
                "获取题目成功",
                satQuestionService.getNextQuestion(
                    request, userResolver.resolveOptional(httpRequest))
            );
        } catch (Exception e) {
            return error(e, "获取题目失败");
        }
    }

    @PostMapping(value = "/submit-answer", produces = "application/json")
    public ApiResponse<AnswerResponse> submitAnswerWithRecord(
            @Valid @RequestBody AnswerRequest request,
            HttpServletRequest httpRequest) {
        try {
            return ApiResponse.success(
                "答题完成",
                satQuestionService.submitAnswerWithRecord(
                    request, userResolver.resolveRequired(httpRequest))
            );
        } catch (Exception e) {
            return error(e, "答题失败");
        }
    }

    @GetMapping(value = "/answer-record/{questionId}", produces = "application/json")
    public ApiResponse<AnswerResponse> getRecordedAnswer(
            @PathVariable Integer questionId,
            @RequestParam(required = false) String sessionId,
            HttpServletRequest httpRequest) {
        try {
            return ApiResponse.success(
                "答题记录获取成功",
                satQuestionService.getRecordedAnswer(
                    questionId, userResolver.resolveRequired(httpRequest), sessionId)
            );
        } catch (Exception e) {
            return error(e, "答题记录获取失败");
        }
    }

    @PostMapping(value = "/session", produces = "application/json")
    public ApiResponse<String> generateSession() {
        try {
            return ApiResponse.success("会话创建成功", satQuestionService.generateSessionId());
        } catch (Exception e) {
            return error(e, "创建会话失败");
        }
    }

    private <T> ApiResponse<T> error(Exception exception, String context) {
        if (exception instanceof AuthenticatedUserResolver.AuthenticationException) {
            return ApiResponse.error(401, exception.getMessage());
        }
        if (exception instanceof IllegalArgumentException) {
            return ApiResponse.error(400, exception.getMessage());
        }
        if (exception instanceof IllegalStateException) {
            return ApiResponse.error(409, exception.getMessage());
        }
        String detail = exception.getMessage() == null ? "未知错误" : exception.getMessage();
        return ApiResponse.error(500, context + ": " + detail);
    }
}
