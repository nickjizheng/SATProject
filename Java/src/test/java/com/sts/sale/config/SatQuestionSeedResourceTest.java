package com.sts.sale.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SatQuestionSeedResourceTest {

    @Test
    void seedContainsEveryQuestionWithAValidAnswerKey() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        Set<Integer> ids = new HashSet<>();
        Set<String> domains = new HashSet<>();
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
                domains.add(question.path("domain").asText());
                rows += 1;
            }
        }

        assertEquals(2474, rows);
        assertEquals(8, domains.size());
    }
}
