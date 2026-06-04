package com.sts.sale.controller;

import com.sts.sale.dto.*;
import com.sts.sale.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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
        return ApiResponse.success("后端服务正常运行", "OK");
    }
    
    /**
     * 发送邮箱验证码
     */
    @PostMapping(value = "/send-verification-code", produces = "application/json")
    public ApiResponse<Void> sendVerificationCode(@Valid @RequestBody SendVerificationCodeRequest request) {
        try {
            String email = request.getEmail();
            if (email == null || email.trim().isEmpty()) {
                return ApiResponse.error("邮箱不能为空");
            }
            
            // 简单的邮箱格式验证
            if (!email.contains("@") || !email.contains(".")) {
                return ApiResponse.error("邮箱格式不正确");
            }
            
            // 使用UserService发送验证码
            userService.sendVerificationCode(email);
            
            System.out.println("验证码已发送到: " + email);
            
            return ApiResponse.success("验证码发送成功，请查收邮箱");
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("发送验证码失败: " + e.getMessage());
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
                return ApiResponse.error(400, "用户名不能为空");
            }
            
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ApiResponse.error(400, "邮箱不能为空");
            }
            
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ApiResponse.error(400, "密码不能为空");
            }
            
            if (request.getVerificationCode() == null || request.getVerificationCode().trim().isEmpty()) {
                return ApiResponse.error(400, "验证码不能为空");
            }
            
            // 密码长度验证
            if (request.getPassword().length() < 6) {
                return ApiResponse.error(400, "密码长度至少6位");
            }
            
            // 使用UserService进行注册
            AuthResponse response = userService.register(request);
            
            System.out.println("注册成功: " + request.getUsername() + " (" + request.getEmail() + ")");
            
            return ApiResponse.success("注册成功", response);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("注册失败: " + e.getMessage());
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
                return ApiResponse.error("用户名或邮箱不能为空");
            }
            
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ApiResponse.error("密码不能为空");
            }
            
            // 使用UserService进行登录
            AuthResponse response = userService.login(request);
            
            System.out.println("登录成功: " + request.getUsernameOrEmail());
            
            return ApiResponse.success("登录成功", response);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("登录失败: " + e.getMessage());
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
            return ApiResponse.success("登出成功");
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
