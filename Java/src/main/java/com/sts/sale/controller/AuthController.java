package com.sts.sale.controller;

import com.sts.sale.dto.*;
import com.sts.sale.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * 健康检查端点
     */
    @GetMapping(value = "/health", produces = "application/json")
    public ApiResponse<String> health() {
        return ApiResponse.success("Backend service is running normally.", "OK");
    }

    /**
     * 发送邮箱验证码
     */
    @PostMapping(value = "/send-verification-code", produces = "application/json")
    public ApiResponse<Void> sendVerificationCode(@Valid @RequestBody SendVerificationCodeRequest request) {
        try {
            String email = request.getEmail();
            if (email == null || email.trim().isEmpty()) {
                return ApiResponse.error(400, "Email is required.");
            }

            // 简单的邮箱格式验证
            if (!email.contains("@") || !email.contains(".")) {
                return ApiResponse.error(400, "Please enter a valid email address.");
            }

            // 使用UserService发送验证码
            userService.sendVerificationCode(email);

            System.out.println("Verification code sent to: " + email);

            return ApiResponse.success("Verification code sent successfully. Please check your inbox.");
        } catch (IllegalStateException e) {
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("Failed to send verification code: " + e.getMessage());
        }
    }

    /**
     * 用户注册
     */
    @PostMapping(value = "/register", produces = "application/json")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // 基本参数验证
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ApiResponse.error(400, "Username is required.");
            }

            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ApiResponse.error(400, "Email is required.");
            }

            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ApiResponse.error(400, "Password is required.");
            }

            if (request.getVerificationCode() == null || request.getVerificationCode().trim().isEmpty()) {
                return ApiResponse.error(400, "Verification code is required.");
            }

            // 密码长度验证
            if (request.getPassword().length() < 6) {
                return ApiResponse.error(400, "Password must be at least 6 characters long.");
            }

            // 使用UserService进行注册
            AuthResponse response = userService.register(request);

            System.out.println("Registration succeeded: " + request.getUsername() + " (" + request.getEmail() + ")");

            return ApiResponse.success("Registration succeeded.", response);
        } catch (IllegalStateException e) {
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("Registration failed: " + e.getMessage());
        }
    }

    /**
     * 用户登录
     */
    @PostMapping(value = "/login", produces = "application/json")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            // 基本参数验证
            if (request.getUsernameOrEmail() == null || request.getUsernameOrEmail().trim().isEmpty()) {
                return ApiResponse.error(400, "Username or email is required.");
            }

            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ApiResponse.error(400, "Password is required.");
            }

            // 使用UserService进行登录
            AuthResponse response = userService.login(request);

            System.out.println("Login succeeded: " + request.getUsernameOrEmail());

            return ApiResponse.success("Login succeeded.", response);
        } catch (IllegalStateException e) {
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("Login failed: " + e.getMessage());
        }
    }

    /**
     * Public Google Identity Services configuration used to render the official button.
     */
    @GetMapping(value = "/google/config", produces = "application/json")
    public ApiResponse<Map<String, Object>> googleConfig() {
        String clientId = userService.getGoogleClientId();
        return ApiResponse.success(Map.of(
            "configured", clientId != null && !clientId.isBlank(),
            "clientId", clientId == null ? "" : clientId
        ));
    }

    /**
     * Exchange a verified Google ID token for the normal PeakSAT JWT session.
     */
    @PostMapping(value = "/google", produces = "application/json")
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        try {
            AuthResponse response = userService.loginWithGoogle(request.getCredential());
            return ApiResponse.success("Google sign-in succeeded.", response);
        } catch (IllegalStateException e) {
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("Google sign-in failed. Please try again.");
        }
    }

    /**
     * 用户登出
     */
    @PostMapping(value = "/logout", produces = "application/json")
    public ApiResponse<Void> logout(@RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            userService.logout(token);
            return ApiResponse.success("Logout succeeded.");
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
