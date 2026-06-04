package com.sts.sale.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sts.sale.dto.FavoriteWordRequest;
import com.sts.sale.dto.FavoriteWordResponse;
import com.sts.sale.mapper.FavoriteWordMapper;
import com.sts.sale.model.FavoriteWord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteWordService {
    
    @Autowired
    private FavoriteWordMapper favoriteWordMapper;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * 添加收藏单词
     */
    public FavoriteWordResponse addFavoriteWord(Long userId, FavoriteWordRequest request) {
        // 检查是否已经收藏
        FavoriteWord existing = favoriteWordMapper.findByUserIdAndWord(userId, request.getWord());
        if (existing != null) {
            throw new RuntimeException("单词已经收藏过了");
        }
        
        FavoriteWord favoriteWord = new FavoriteWord();
        favoriteWord.setUserId(userId);
        favoriteWord.setWord(request.getWord());
        favoriteWord.setWordData(request.getWordData());
        favoriteWord.setCreatedAt(LocalDateTime.now());
        favoriteWord.setUpdatedAt(LocalDateTime.now());
        
        favoriteWordMapper.insert(favoriteWord);
        
        return convertToResponse(favoriteWord);
    }
    
    /**
     * 获取用户收藏的单词列表
     */
    public List<FavoriteWordResponse> getFavoriteWords(Long userId) {
        List<FavoriteWord> favoriteWords = favoriteWordMapper.findByUserId(userId);
        return favoriteWords.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 删除收藏的单词
     */
    public void removeFavoriteWord(Long userId, String word) {
        QueryWrapper<FavoriteWord> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId).eq("word", word);
        
        int deleted = favoriteWordMapper.delete(queryWrapper);
        if (deleted == 0) {
            throw new RuntimeException("收藏的单词不存在");
        }
    }
    
    /**
     * 检查单词是否已收藏
     */
    public boolean isWordFavorited(Long userId, String word) {
        FavoriteWord favoriteWord = favoriteWordMapper.findByUserIdAndWord(userId, word);
        return favoriteWord != null;
    }
    
    /**
     * 转换为响应对象
     */
    private FavoriteWordResponse convertToResponse(FavoriteWord favoriteWord) {
        FavoriteWordResponse response = new FavoriteWordResponse();
        response.setId(favoriteWord.getId());
        response.setWord(favoriteWord.getWord());
        response.setWordData(favoriteWord.getWordData());
        response.setCreatedAt(favoriteWord.getCreatedAt());
        
        // 从JSON数据中提取信息
        try {
            JsonNode wordDataNode = objectMapper.readTree(favoriteWord.getWordData());
            
            // 提取词性
            if (wordDataNode.has("fl")) {
                response.setPartOfSpeech(wordDataNode.get("fl").asText());
            }
            
            // 提取发音
            if (wordDataNode.has("hwi") && wordDataNode.get("hwi").has("prs")) {
                JsonNode prs = wordDataNode.get("hwi").get("prs");
                if (prs.isArray() && prs.size() > 0 && prs.get(0).has("mw")) {
                    response.setPronunciation(prs.get(0).get("mw").asText());
                }
            }
            
            // 提取简短定义
            if (wordDataNode.has("shortdef")) {
                JsonNode shortdef = wordDataNode.get("shortdef");
                if (shortdef.isArray() && shortdef.size() > 0) {
                    response.setShortDefinition(shortdef.get(0).asText());
                }
            }
            
        } catch (Exception e) {
            // 如果解析失败，使用默认值
            response.setShortDefinition("定义解析失败");
        }
        
        return response;
    }
}
