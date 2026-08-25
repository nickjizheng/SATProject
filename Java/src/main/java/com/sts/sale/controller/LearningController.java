package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.dto.LearningProfileRequest;
import com.sts.sale.dto.LearningProfileResponse;
import com.sts.sale.dto.MistakeItem;
import com.sts.sale.dto.MistakeReflectionRequest;
import com.sts.sale.dto.MistakeSummary;
import com.sts.sale.dto.QuestionReportRequest;
import com.sts.sale.dto.QuestionReportResponse;
import com.sts.sale.dto.ReadinessResponse;
import com.sts.sale.service.LearningService;
import com.sts.sale.utils.AuthenticatedUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/learning")
public class LearningController {

    private final LearningService learningService;
    private final AuthenticatedUserResolver userResolver;

    public LearningController(LearningService learningService,
                              AuthenticatedUserResolver userResolver) {
        this.learningService = learningService;
        this.userResolver = userResolver;
    }

    @GetMapping(value = "/profile", produces = "application/json")
    public ApiResponse<LearningProfileResponse> getProfile(HttpServletRequest request) {
        try {
            return ApiResponse.success(
                learningService.getProfile(userResolver.resolveRequired(request)));
        } catch (Exception exception) {
            return error(exception);
        }
    }

    @PutMapping(value = "/profile", produces = "application/json")
    public ApiResponse<LearningProfileResponse> updateProfile(
            HttpServletRequest httpRequest,
            @Valid @RequestBody LearningProfileRequest request) {
        try {
            return ApiResponse.success(
                learningService.updateProfile(
                    userResolver.resolveRequired(httpRequest), request));
        } catch (Exception exception) {
            return error(exception);
        }
    }

    @GetMapping(value = "/readiness", produces = "application/json")
    public ApiResponse<ReadinessResponse> getReadiness(HttpServletRequest request) {
        try {
            return ApiResponse.success(
                learningService.getReadiness(userResolver.resolveRequired(request)));
        } catch (Exception exception) {
            return error(exception);
        }
    }

    @GetMapping(value = "/mistakes", produces = "application/json")
    public ApiResponse<List<MistakeItem>> getMistakes(
            HttpServletRequest httpRequest,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String resolved,
            @RequestParam(defaultValue = "30") int limit) {
        try {
            return ApiResponse.success(learningService.getMistakes(
                userResolver.resolveRequired(httpRequest),
                reason,
                domain,
                resolved,
                limit));
        } catch (Exception exception) {
            return error(exception);
        }
    }

    @GetMapping(value = "/mistakes/summary", produces = "application/json")
    public ApiResponse<MistakeSummary> getMistakeSummary(HttpServletRequest request) {
        try {
            return ApiResponse.success(
                learningService.getMistakeSummary(userResolver.resolveRequired(request)));
        } catch (Exception exception) {
            return error(exception);
        }
    }

    @PutMapping(value = "/mistakes/{questionId}", produces = "application/json")
    public ApiResponse<MistakeItem> updateMistake(
            HttpServletRequest httpRequest,
            @PathVariable Integer questionId,
            @Valid @RequestBody MistakeReflectionRequest request) {
        try {
            return ApiResponse.success(learningService.updateMistake(
                userResolver.resolveRequired(httpRequest), questionId, request));
        } catch (Exception exception) {
            return error(exception);
        }
    }

    @PostMapping(value = "/questions/{questionId}/report", produces = "application/json")
    public ApiResponse<QuestionReportResponse> reportQuestion(
            HttpServletRequest httpRequest,
            @PathVariable Integer questionId,
            @Valid @RequestBody QuestionReportRequest request) {
        try {
            return ApiResponse.success(learningService.reportQuestion(
                userResolver.resolveRequired(httpRequest), questionId, request));
        } catch (Exception exception) {
            return error(exception);
        }
    }

    @GetMapping(value = "/questions/{questionId}/report", produces = "application/json")
    public ApiResponse<List<QuestionReportResponse>> getQuestionReports(
            HttpServletRequest httpRequest,
            @PathVariable Integer questionId) {
        try {
            return ApiResponse.success(learningService.getQuestionReports(
                userResolver.resolveRequired(httpRequest), questionId));
        } catch (Exception exception) {
            return error(exception);
        }
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ApiResponse<Object> handleValidation(Exception exception) {
        String message = "The request is invalid.";
        if (exception instanceof BindException bindException
                && bindException.getBindingResult().getFieldError() != null) {
            message = bindException.getBindingResult().getFieldError().getDefaultMessage();
        }
        return ApiResponse.error(400, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ApiResponse<Object> handleUnreadableBody() {
        return ApiResponse.error(400, "The request body contains an invalid value.");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ApiResponse<Object> handleInvalidParameter() {
        return ApiResponse.error(400, "A request parameter contains an invalid value.");
    }

    private <T> ApiResponse<T> error(Exception exception) {
        if (exception instanceof AuthenticatedUserResolver.AuthenticationException) {
            return ApiResponse.error(401, exception.getMessage());
        }
        if (exception instanceof LearningService.ResourceNotFoundException) {
            return ApiResponse.error(404, exception.getMessage());
        }
        if (exception instanceof IllegalArgumentException) {
            return ApiResponse.error(400, exception.getMessage());
        }
        if (exception instanceof IllegalStateException) {
            return ApiResponse.error(409, exception.getMessage());
        }
        String message = exception.getMessage() == null
            ? "The learning data could not be loaded." : exception.getMessage();
        return ApiResponse.error(500, message);
    }
}
