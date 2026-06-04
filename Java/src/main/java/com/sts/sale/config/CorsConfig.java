package com.sts.sale.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // 使用allowedOriginPatterns支持通配符模式，同时允许credentials
                .allowedOriginPatterns(
                    "http://localhost:*",
                    "http://127.0.0.1:*",
                    "http://10.0.2.2:*",  // Android模拟器访问电脑localhost
                    "http://192.168.*.*:*",  // 局域网IP地址
                    "chrome-extension://*",  // 允许Postman Chrome扩展
                    "null"  // 允许Postman桌面应用
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                .allowedHeaders("*") // 放开所有请求头
                .allowCredentials(true) // 允许携带 Cookie/Authorization
                .maxAge(3600); // 预检请求缓存时间
    }
}
