package com.sts.sale.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class SatQuestionDataSeeder implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(SatQuestionDataSeeder.class);
    private static final int BATCH_SIZE = 200;
    private static final String UPSERT_SQL = """
        INSERT INTO sat_questions (
            id, original_id, domain, visuals_type, visuals_svg_content,
            question_text, question_paragraph, question_explanation,
            choice_a, choice_b, choice_c, choice_d, correct_answer
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            original_id = VALUES(original_id),
            domain = VALUES(domain),
            visuals_type = VALUES(visuals_type),
            visuals_svg_content = VALUES(visuals_svg_content),
            question_text = VALUES(question_text),
            question_paragraph = VALUES(question_paragraph),
            question_explanation = VALUES(question_explanation),
            choice_a = VALUES(choice_a),
            choice_b = VALUES(choice_b),
            choice_c = VALUES(choice_c),
            choice_d = VALUES(choice_d),
            correct_answer = VALUES(correct_answer)
        """;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final Resource seedResource;

    public SatQuestionDataSeeder(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            @Value("${app.question-seed.enabled:true}") boolean enabled,
            @Value("${app.question-seed.resource}") Resource seedResource) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.seedResource = seedResource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!enabled) {
            logger.info("SAT question seed is disabled.");
            return;
        }

        int importedRows = 0;
        Set<Integer> questionIds = new HashSet<>();
        Set<String> domains = new HashSet<>();
        List<Object[]> batch = new ArrayList<>(BATCH_SIZE);

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                seedResource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;

                JsonNode question = objectMapper.readTree(line);
                int questionId = requiredInteger(question, "id");
                String domain = requiredText(question, "domain");
                String correctAnswer = requiredText(question, "correct_answer").toUpperCase();

                if (!questionIds.add(questionId)) {
                    throw new IllegalStateException("Duplicate SAT question ID in seed: " + questionId);
                }
                if (!correctAnswer.matches("[A-D]")) {
                    throw new IllegalStateException("Invalid answer key for SAT question " + questionId);
                }

                JsonNode choices = question.path("choices");
                batch.add(new Object[]{
                    questionId,
                    nullableText(question, "original_id"),
                    domain,
                    nullableText(question, "visuals_type"),
                    nullableText(question, "visuals_svg_content"),
                    requiredText(question, "question_text"),
                    nullableText(question, "question_paragraph"),
                    nullableText(question, "answer_explanation"),
                    requiredText(choices, "A"),
                    requiredText(choices, "B"),
                    requiredText(choices, "C"),
                    requiredText(choices, "D"),
                    correctAnswer
                });
                domains.add(domain);
                importedRows += 1;

                if (batch.size() == BATCH_SIZE) {
                    jdbcTemplate.batchUpdate(UPSERT_SQL, batch);
                    batch.clear();
                }
            }
        }

        if (!batch.isEmpty()) {
            jdbcTemplate.batchUpdate(UPSERT_SQL, batch);
        }
        if (importedRows == 0) {
            throw new IllegalStateException("SAT question seed is empty.");
        }

        logger.info("SAT question seed synchronized: rows={}, domains={}", importedRows, domains.size());
    }

    private int requiredInteger(JsonNode node, String fieldName) {
        JsonNode field = node.get(fieldName);
        if (field == null || !field.canConvertToInt()) {
            throw new IllegalStateException("Missing integer field: " + fieldName);
        }
        return field.asInt();
    }

    private String requiredText(JsonNode node, String fieldName) {
        String value = nullableText(node, fieldName);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing text field: " + fieldName);
        }
        return value;
    }

    private String nullableText(JsonNode node, String fieldName) {
        JsonNode field = node.get(fieldName);
        if (field == null || field.isNull()) return null;

        String value = field.asText();
        return value.equalsIgnoreCase("null") ? null : value;
    }
}
