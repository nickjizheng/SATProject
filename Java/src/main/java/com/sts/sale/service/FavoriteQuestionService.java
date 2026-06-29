package com.sts.sale.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sts.sale.dto.FavoriteQuestionRequest;
import com.sts.sale.dto.FavoriteQuestionResponse;
import com.sts.sale.mapper.FavoriteQuestionMapper;
import com.sts.sale.model.FavoriteQuestion;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteQuestionService {

    @Autowired
    private FavoriteQuestionMapper favoriteQuestionMapper;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 添加收藏题目
     */
    public FavoriteQuestionResponse addFavoriteQuestion(Long userId, FavoriteQuestionRequest request) {
        // 检查是否已经收藏
        FavoriteQuestion existing = favoriteQuestionMapper.findByUserIdAndQuestionId(userId, request.getQuestionId());
        if (existing != null) {
            throw new RuntimeException("题目已经收藏过了");
        }

        FavoriteQuestion favoriteQuestion = new FavoriteQuestion();
        favoriteQuestion.setUserId(userId);
        favoriteQuestion.setQuestionId(request.getQuestionId());
        favoriteQuestion.setQuestionData(request.getQuestionData());
        favoriteQuestion.setCreatedAt(LocalDateTime.now());
        favoriteQuestion.setUpdatedAt(LocalDateTime.now());

        favoriteQuestionMapper.insert(favoriteQuestion);

        return convertToResponse(favoriteQuestion);
    }

    /**
     * 获取用户收藏的题目列表
     */
    public List<FavoriteQuestionResponse> getFavoriteQuestions(Long userId) {
        List<FavoriteQuestion> favoriteQuestions = favoriteQuestionMapper.findByUserId(userId);
        return favoriteQuestions.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * 删除收藏的题目
     */
    public void removeFavoriteQuestion(Long userId, Long questionId) {
        QueryWrapper<FavoriteQuestion> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId).eq("question_id", questionId);

        int deleted = favoriteQuestionMapper.delete(queryWrapper);
        if (deleted == 0) {
            throw new RuntimeException("收藏的题目不存在");
        }
    }

    /**
     * 检查题目是否已收藏
     */
    public boolean isQuestionFavorited(Long userId, Long questionId) {
        FavoriteQuestion favoriteQuestion = favoriteQuestionMapper.findByUserIdAndQuestionId(userId, questionId);
        return favoriteQuestion != null;
    }

    /**
     * 转换为响应对象
     */
    private FavoriteQuestionResponse convertToResponse(FavoriteQuestion favoriteQuestion) {
        FavoriteQuestionResponse response = new FavoriteQuestionResponse();
        response.setId(favoriteQuestion.getId());
        response.setQuestionId(favoriteQuestion.getQuestionId());
        response.setQuestionData(favoriteQuestion.getQuestionData());
        response.setCreatedAt(favoriteQuestion.getCreatedAt());

        // 从JSON数据中提取信息
        try {
            JsonNode questionDataNode = objectMapper.readTree(favoriteQuestion.getQuestionData());

            // Current clients store questionText; retain question for legacy favorites.
            if (questionDataNode.hasNonNull("questionText")) {
                response.setQuestionText(questionDataNode.get("questionText").asText());
            } else if (questionDataNode.hasNonNull("question")) {
                response.setQuestionText(questionDataNode.get("question").asText());
            }

            // 提取领域
            if (questionDataNode.has("domain")) {
                response.setDomain(questionDataNode.get("domain").asText());
            }

            // 提取难度
            if (questionDataNode.has("difficulty")) {
                response.setDifficulty(questionDataNode.get("difficulty").asText());
            }

        } catch (Exception e) {
            // 如果解析失败，使用默认值
            response.setQuestionText("题目解析失败");
        }

        return response;
    }
}
