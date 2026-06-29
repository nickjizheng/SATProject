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
     * Saves a dictionary result for one user and returns its display model.
     */
    public FavoriteWordResponse addFavoriteWord(Long userId, FavoriteWordRequest request) {
        // Reject duplicates for this user while allowing other users to save the word.
        FavoriteWord existing = favoriteWordMapper.findByUserIdAndWord(userId, request.getWord());
        if (existing != null) {
            throw new RuntimeException("单词已经收藏过了");
        }

        // Keep the original JSON payload so its dictionary fields can be rebuilt later.
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
     * Retrieves and converts all words saved by one user.
     */
    public List<FavoriteWordResponse> getFavoriteWords(Long userId) {
        List<FavoriteWord> favoriteWords = favoriteWordMapper.findByUserId(userId);
        return favoriteWords.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Removes a saved word belonging to one user.
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
     * Checks whether a word is already saved by one user.
     */
    public boolean isWordFavorited(Long userId, String word) {
        FavoriteWord favoriteWord = favoriteWordMapper.findByUserIdAndWord(userId, word);
        return favoriteWord != null;
    }

    /**
     * Converts stored JSON into the fields required by the saved-word UI.
     */
    private FavoriteWordResponse convertToResponse(FavoriteWord favoriteWord) {
        FavoriteWordResponse response = new FavoriteWordResponse();
        response.setId(favoriteWord.getId());
        response.setWord(favoriteWord.getWord());
        response.setWordData(favoriteWord.getWordData());
        response.setCreatedAt(favoriteWord.getCreatedAt());

        // Parse as a tree so optional and nested dictionary fields can be checked safely.
        try {
            JsonNode wordDataNode = objectMapper.readTree(favoriteWord.getWordData());

            // Read the part of speech only when the dictionary supplied it.
            if (wordDataNode.has("fl")) {
                response.setPartOfSpeech(wordDataNode.get("fl").asText());
            }

            // Walk hwi.prs[0].mw defensively because pronunciation is optional.
            if (wordDataNode.has("hwi") && wordDataNode.get("hwi").has("prs")) {
                JsonNode prs = wordDataNode.get("hwi").get("prs");
                if (prs.isArray() && prs.size() > 0 && prs.get(0).has("mw")) {
                    response.setPronunciation(prs.get(0).get("mw").asText());
                }
            }

            // Use the first short definition as the compact saved-list summary.
            if (wordDataNode.has("shortdef")) {
                JsonNode shortdef = wordDataNode.get("shortdef");
                if (shortdef.isArray() && shortdef.size() > 0) {
                    response.setShortDefinition(shortdef.get(0).asText());
                }
            }

        } catch (Exception e) {
            // Preserve a usable response even when a legacy payload is malformed.
            response.setShortDefinition("Definition could not be parsed.");
        }

        return response;
    }
}
