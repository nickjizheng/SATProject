package com.sts.sale.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.DatabasePopulatorUtils;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.sql.SQLTransientException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

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
    private static final String QUALITY_UPSERT_SQL = """
        INSERT INTO sat_question_quality (
            question_id, quality_status, usable, answer_key_source, duplicate_of_question_id
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            quality_status = VALUES(quality_status),
            usable = VALUES(usable),
            answer_key_source = VALUES(answer_key_source),
            duplicate_of_question_id = VALUES(duplicate_of_question_id)
        """;

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final Resource seedResource;
    private final Resource schemaResource;
    private final long retryInitialDelayMillis;
    private final long retryMaxDelayMillis;
    private final AtomicBoolean workerStarted = new AtomicBoolean(false);

    private volatile boolean running = true;
    private volatile Thread workerThread;

    public SatQuestionDataSeeder(
            JdbcTemplate jdbcTemplate,
            DataSource dataSource,
            ObjectMapper objectMapper,
            @Value("${app.question-seed.enabled:true}") boolean enabled,
            @Value("${app.question-seed.resource}") Resource seedResource,
            @Value("${app.database-bootstrap.schema-resource:classpath:schema.sql}") Resource schemaResource,
            @Value("${app.database-bootstrap.retry-initial-delay-ms:1000}") long retryInitialDelayMillis,
            @Value("${app.database-bootstrap.retry-max-delay-ms:30000}") long retryMaxDelayMillis) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.seedResource = seedResource;
        this.schemaResource = schemaResource;
        this.retryInitialDelayMillis = Math.max(1, retryInitialDelayMillis);
        this.retryMaxDelayMillis = Math.max(this.retryInitialDelayMillis, retryMaxDelayMillis);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!workerStarted.compareAndSet(false, true)) {
            logger.debug("Database bootstrap worker is already running.");
            return;
        }

        Thread thread = new Thread(this::synchronizeWithRetry, "database-bootstrap");
        thread.setDaemon(true);
        workerThread = thread;
        thread.start();
        logger.info("Database bootstrap scheduled in the background.");
    }

    /**
     * Synchronous entry point kept package-private so bootstrap ordering and seed
     * behavior can be verified without starting a background thread.
     */
    void synchronizeOnce() throws Exception {
        applySchema();
        if (enabled) {
            synchronizeSeed();
        } else {
            logger.info("SAT question seed is disabled; schema synchronization completed.");
        }
    }

    void applySchema() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setContinueOnError(false);
        populator.addScript(schemaResource);
        DatabasePopulatorUtils.execute(populator, dataSource);
        logger.info("Database schema synchronized.");
    }

    void synchronizeSeed() throws Exception {
        int importedRows = 0;
        Set<Integer> questionIds = new HashSet<>();
        Set<String> domains = new HashSet<>();
        List<Object[]> batch = new ArrayList<>(BATCH_SIZE);
        List<Object[]> qualityBatch = new ArrayList<>(BATCH_SIZE);

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                seedResource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;

                JsonNode question = objectMapper.readTree(line);
                int questionId = requiredInteger(question, "id");
                String domain = requiredText(question, "domain");
                String correctAnswer = requiredText(question, "correct_answer").toUpperCase();
                String qualityStatus = requiredText(question, "quality_status");
                boolean usable = qualityStatus.equals("source_provided")
                    || qualityStatus.equals("auto_approved");

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
                qualityBatch.add(new Object[]{
                    questionId,
                    qualityStatus,
                    usable,
                    requiredText(question, "answer_key_source"),
                    nullableInteger(question, "duplicate_of_question_id")
                });
                domains.add(domain);
                importedRows += 1;

                if (batch.size() == BATCH_SIZE) {
                    jdbcTemplate.batchUpdate(UPSERT_SQL, batch);
                    jdbcTemplate.batchUpdate(QUALITY_UPSERT_SQL, qualityBatch);
                    batch.clear();
                    qualityBatch.clear();
                }
            }
        }

        if (!batch.isEmpty()) {
            jdbcTemplate.batchUpdate(UPSERT_SQL, batch);
            jdbcTemplate.batchUpdate(QUALITY_UPSERT_SQL, qualityBatch);
        }
        if (importedRows == 0) {
            throw new IllegalStateException("SAT question seed is empty.");
        }

        logger.info("SAT question seed synchronized: rows={}, domains={}", importedRows, domains.size());
    }

    private void synchronizeWithRetry() {
        long retryDelayMillis = retryInitialDelayMillis;

        while (running) {
            try {
                synchronizeOnce();
                return;
            } catch (Exception exception) {
                if (!isTransientDatabaseFailure(exception)) {
                    logger.error("Database bootstrap stopped after a non-transient failure.", exception);
                    return;
                }

                logger.warn(
                    "Database is not ready; retrying schema and seed synchronization in {} ms.",
                    retryDelayMillis,
                    exception
                );
            }

            if (!sleepBeforeRetry(retryDelayMillis)) {
                return;
            }
            retryDelayMillis = nextRetryDelay(retryDelayMillis);
        }
    }

    private boolean sleepBeforeRetry(long delayMillis) {
        try {
            Thread.sleep(delayMillis);
            return running;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private long nextRetryDelay(long currentDelayMillis) {
        if (currentDelayMillis >= retryMaxDelayMillis / 2) {
            return retryMaxDelayMillis;
        }
        return Math.min(retryMaxDelayMillis, currentDelayMillis * 2);
    }

    private boolean isTransientDatabaseFailure(Throwable failure) {
        Throwable current = failure;
        while (current != null) {
            if (current instanceof CannotGetJdbcConnectionException
                    || current instanceof TransientDataAccessException
                    || current instanceof SQLTransientException) {
                return true;
            }
            if (current instanceof SQLException sqlException) {
                String sqlState = sqlException.getSQLState();
                if (sqlState != null && (sqlState.startsWith("08") || sqlState.startsWith("40")
                        || sqlState.startsWith("HYT"))) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }

    @PreDestroy
    void stopWorker() {
        running = false;
        Thread thread = workerThread;
        if (thread != null) {
            thread.interrupt();
        }
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

    private Integer nullableInteger(JsonNode node, String fieldName) {
        JsonNode field = node.get(fieldName);
        if (field == null || field.isNull()) return null;
        if (!field.canConvertToInt()) {
            throw new IllegalStateException("Invalid integer field: " + fieldName);
        }
        return field.asInt();
    }

    private String nullableText(JsonNode node, String fieldName) {
        JsonNode field = node.get(fieldName);
        if (field == null || field.isNull()) return null;

        String value = field.asText();
        return value.equalsIgnoreCase("null") ? null : value;
    }
}
