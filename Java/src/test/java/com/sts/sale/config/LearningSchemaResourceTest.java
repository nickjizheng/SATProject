package com.sts.sale.config;

import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LearningSchemaResourceTest {

    @Test
    void learningTablesAreIdempotentOwnedAndMysql57Compatible() throws Exception {
        InputStream stream = getClass().getResourceAsStream("/schema.sql");
        assertNotNull(stream);
        String schema;
        try (stream) {
            schema = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }

        assertTrue(schema.contains("CREATE TABLE IF NOT EXISTS learning_profiles"));
        assertTrue(schema.contains("PRIMARY KEY (user_id)"));
        assertTrue(schema.contains("CREATE TABLE IF NOT EXISTS mistake_reflections"));
        assertTrue(schema.contains(
            "UNIQUE KEY uk_mistake_reflection_user_question (user_id, question_id)"));
        assertTrue(schema.contains("CREATE TABLE IF NOT EXISTS question_reports"));
        assertTrue(schema.contains(
            "UNIQUE KEY uk_question_report_user_question_reason (user_id, question_id, reason)"));
        assertFalse(schema.toUpperCase().contains("ROW_NUMBER("));
        assertFalse(schema.toUpperCase().contains("CREATE TABLE IF NOT EXISTS LEARNING_PROFILES (\n    ID "));
    }
}
