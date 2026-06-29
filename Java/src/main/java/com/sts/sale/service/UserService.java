package com.sts.sale.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.sts.sale.dto.RegisterRequest;
import com.sts.sale.dto.LoginRequest;
import com.sts.sale.dto.AuthResponse;
import com.sts.sale.mapper.UserMapper;
import com.sts.sale.mapper.EmailVerificationCodeMapper;
import com.sts.sale.mapper.UserSessionMapper;
import com.sts.sale.model.User;
import com.sts.sale.model.EmailVerificationCode;
import com.sts.sale.model.UserSession;
import com.sts.sale.utils.JwtUtil;
import com.sts.sale.utils.PasswordUtil;
import com.sts.sale.utils.RandomNumberGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.text.Normalizer;
import java.util.UUID;

/**
 * 用户服务类
 */
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private EmailVerificationCodeMapper emailVerificationCodeMapper;

    @Autowired
    private UserSessionMapper userSessionMapper;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordUtil passwordUtil;

    @Autowired
    private RandomNumberGenerator randomNumberGenerator;

    @Autowired
    private GoogleIdentityService googleIdentityService;

    /**
     * 发送邮箱验证码
     */
    @Transactional
    public void sendVerificationCode(String email) {
        // 检查邮箱是否已注册
        User existingUser = userMapper.findByEmail(email);
        if (existingUser != null) {
            throw new IllegalStateException("This email is already registered. Please log in instead.");
        }

        // 清理该邮箱的过期验证码
        emailVerificationCodeMapper.cleanExpiredCodes(email, LocalDateTime.now());

        // 生成6位数字验证码
        String code = randomNumberGenerator.generateVerificationCode();

        // 保存验证码到数据库
        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setType("REGISTER");
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10)); // 10分钟过期
        verificationCode.setUsed(false);
        verificationCode.setCreatedAt(LocalDateTime.now());

        emailVerificationCodeMapper.insert(verificationCode);

        // 发送邮件
        try {
            emailService.sendHtmlMail(email, code);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send the verification email. " + e.getMessage());
        }
    }

    /**
     * 用户注册
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 检查用户名是否已存在
        User existingUserByUsername = userMapper.findByUsername(request.getUsername());
        if (existingUserByUsername != null) {
            throw new IllegalStateException("That username is already taken.");
        }

        // 检查邮箱是否已存在
        User existingUserByEmail = userMapper.findByEmail(request.getEmail());
        if (existingUserByEmail != null) {
            throw new IllegalStateException("This email is already registered.");
        }

        // 验证验证码
        EmailVerificationCode validCode = emailVerificationCodeMapper.findLatestUnusedCode(
            request.getEmail(),
            request.getVerificationCode(),
            "REGISTER"
        );

        if (validCode == null) {
            throw new IllegalStateException("The verification code is invalid.");
        }

        if (!validCode.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("The verification code has expired.");
        }

        // 标记验证码为已使用
        emailVerificationCodeMapper.markCodeAsUsed(validCode.getId());

        // 创建新用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordUtil.encode(request.getPassword()));
        user.setEmailVerified(true);
        user.setStatus(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(user);

        // 生成JWT token
        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());

        // 保存会话信息
        saveUserSession(user.getId(), token);

        return new AuthResponse(token, refreshToken, user.getId(), user.getUsername(), user.getEmail(), user.getEmailVerified());
    }

    /**
     * 用户登录
     */
    public AuthResponse login(LoginRequest request) {
        // 查找用户
        User user = userMapper.findByUsernameOrEmail(request.getUsernameOrEmail());
        if (user == null) {
            throw new IllegalStateException("User not found.");
        }

        // 检查用户状态
        if (!user.getStatus()) {
            throw new IllegalStateException("This account has been disabled.");
        }

        // 验证密码
        if (!passwordUtil.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalStateException("Incorrect password.");
        }

        // 生成JWT token
        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());

        // 保存会话信息
        saveUserSession(user.getId(), token);

        return new AuthResponse(token, refreshToken, user.getId(), user.getUsername(), user.getEmail(), user.getEmailVerified());
    }

    /**
     * Sign in an existing Google user or create a local account on first use.
     */
    @Transactional
    public AuthResponse loginWithGoogle(String credential) {
        GoogleIdentityService.GoogleProfile profile = googleIdentityService.verify(credential);
        User user = userMapper.findByGoogleSubject(profile.subject());

        if (user == null) {
            user = userMapper.findByEmail(profile.email());
        }

        if (user == null) {
            user = new User();
            user.setUsername(createAvailableUsername(profile.displayName(), profile.email()));
            user.setEmail(profile.email());
            // The database requires a password; Google-only accounts receive an unusable random one.
            user.setPassword(passwordUtil.encode(UUID.randomUUID().toString()));
            user.setGoogleSubject(profile.subject());
            user.setEmailVerified(true);
            user.setStatus(true);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userMapper.insert(user);
        } else {
            if (!user.getStatus()) {
                throw new IllegalStateException("This account has been disabled.");
            }
            if (user.getGoogleSubject() != null && !user.getGoogleSubject().equals(profile.subject())) {
                throw new IllegalStateException("This email is already linked to another Google account.");
            }

            user.setGoogleSubject(profile.subject());
            user.setEmailVerified(true);
            user.setUpdatedAt(LocalDateTime.now());
            userMapper.updateById(user);
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());
        saveUserSession(user.getId(), token);

        return new AuthResponse(token, refreshToken, user.getId(), user.getUsername(), user.getEmail(), user.getEmailVerified());
    }

    public String getGoogleClientId() {
        return googleIdentityService.getClientId();
    }

    private String createAvailableUsername(String displayName, String email) {
        String source = displayName == null || displayName.isBlank()
            ? email.substring(0, email.indexOf('@'))
            : displayName;
        String base = Normalizer.normalize(source, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replaceAll("[^A-Za-z0-9_]", "_")
            .replaceAll("_+", "_")
            .replaceAll("^_|_$", "")
            .toLowerCase();

        if (base.length() < 3) {
            base = "satbuddy_user";
        }
        base = base.substring(0, Math.min(base.length(), 40));

        String candidate = base;
        int suffix = 1;
        while (userMapper.findByUsername(candidate) != null) {
            String ending = "_" + suffix++;
            candidate = base.substring(0, Math.min(base.length(), 50 - ending.length())) + ending;
        }
        return candidate;
    }

    /**
     * 用户登出
     */
    public void logout(String token) {
        // 将token加入黑名单（这里简化处理，实际项目中可以使用Redis）
        String tokenHash = UUID.nameUUIDFromBytes(token.getBytes()).toString();

        UserSession session = new UserSession();
        session.setTokenHash(tokenHash);
        session.setExpiresAt(LocalDateTime.now().plusDays(7)); // JWT过期时间
        session.setCreatedAt(LocalDateTime.now());

        userSessionMapper.insert(session);
    }

    /**
     * 验证token是否在黑名单中
     */
    public boolean isTokenBlacklisted(String token) {
        String tokenHash = UUID.nameUUIDFromBytes(token.getBytes()).toString();
        UserSession session = userSessionMapper.findByTokenHash(tokenHash);
        return session != null;
    }

    /**
     * 保存用户会话信息
     */
    private void saveUserSession(Long userId, String token) {
        String tokenHash = UUID.nameUUIDFromBytes(token.getBytes()).toString();

        UserSession session = new UserSession();
        session.setUserId(userId);
        session.setTokenHash(tokenHash);
        session.setExpiresAt(LocalDateTime.now().plusDays(7)); // JWT过期时间
        session.setCreatedAt(LocalDateTime.now());

        userSessionMapper.insert(session);
    }
}
