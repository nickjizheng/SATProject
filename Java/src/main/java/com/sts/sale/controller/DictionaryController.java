package com.sts.sale.controller;

import com.sts.sale.dto.ApiResponse;
import com.sts.sale.service.DictionaryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dictionary")
public class DictionaryController {

    private final DictionaryService dictionaryService;

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    @GetMapping("/{word}")
    public ApiResponse<Object> getWordDefinition(@PathVariable String word) {
        String normalizedWord = word == null ? "" : word.trim();
        if (normalizedWord.isEmpty() || normalizedWord.length() > 225) {
            return ApiResponse.error(400, "Please enter a valid word.");
        }

        try {
            return ApiResponse.success(dictionaryService.getWordDefinition(normalizedWord));
        } catch (IllegalStateException exception) {
            return ApiResponse.error(503, exception.getMessage());
        } catch (Exception exception) {
            return ApiResponse.error(502, "Dictionary lookup is temporarily unavailable.");
        }
    }
}
