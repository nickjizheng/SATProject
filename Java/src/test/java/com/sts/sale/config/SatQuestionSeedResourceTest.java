package com.sts.sale.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SatQuestionSeedResourceTest {

    @Test
    void seedContainsEveryQuestionWithAValidAnswerKey() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        Set<Integer> ids = new HashSet<>();
        Set<Integer> duplicateTargets = new HashSet<>();
        Set<String> domains = new HashSet<>();
        Map<String, Integer> qualityCounts = new java.util.HashMap<>();
        int rows = 0;

        InputStream stream = getClass().getResourceAsStream("/data/sat-questions.jsonl");
        assertNotNull(stream, "Question seed resource must be packaged with the backend.");

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;

                JsonNode question = objectMapper.readTree(line);
                assertTrue(ids.add(question.path("id").asInt()), "Question IDs must be unique.");
                assertTrue(question.path("correct_answer").asText().matches("[A-D]"));
                assertTrue(question.path("choices").path("A").isTextual());
                assertTrue(question.path("choices").path("D").isTextual());
                String qualityStatus = question.path("quality_status").asText();
                assertTrue(Set.of(
                    "source_provided", "auto_approved", "needs_review", "error", "duplicate"
                ).contains(qualityStatus));
                assertTrue(question.path("answer_key_source").isTextual());
                assertFalse(question.path("answer_key_source").asText().isBlank());
                if (qualityStatus.equals("duplicate")) {
                    assertTrue(question.path("duplicate_of_question_id").canConvertToInt());
                    duplicateTargets.add(question.path("duplicate_of_question_id").asInt());
                } else {
                    assertTrue(question.path("duplicate_of_question_id").isNull());
                }
                qualityCounts.merge(qualityStatus, 1, Integer::sum);
                domains.add(question.path("domain").asText());
                rows += 1;
            }
        }

        assertEquals(2474, rows);
        assertEquals(8, domains.size());
        assertEquals(79, qualityCounts.get("source_provided"));
        assertEquals(905, qualityCounts.get("auto_approved"));
        assertEquals(1454, qualityCounts.get("needs_review"));
        assertEquals(2, qualityCounts.get("error"));
        assertEquals(34, qualityCounts.get("duplicate"));
        assertTrue(ids.containsAll(duplicateTargets));
        assertEquals(984, qualityCounts.entrySet().stream()
            .filter(entry -> Set.of("source_provided", "auto_approved").contains(entry.getKey()))
            .collect(Collectors.summingInt(Map.Entry::getValue)));
    }
}
