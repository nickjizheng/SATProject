package com.sts.sale.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

class SatQuestionDataSeederTest {

    private SatQuestionDataSeeder activeSeeder;

    @AfterEach
    void stopBackgroundWorker() {
        if (activeSeeder != null) {
            activeSeeder.stopWorker();
        }
    }

    @Test
    void synchronousBootstrapAlwaysAppliesSchemaBeforeSeed() throws Exception {
        RecordingSeeder seeder = new RecordingSeeder(true);

        seeder.synchronizeOnce();

        assertEquals(List.of("schema", "seed"), seeder.calls);
    }

    @Test
    void disabledQuestionSeedStillAppliesSchema() throws Exception {
        RecordingSeeder seeder = new RecordingSeeder(false);

        seeder.synchronizeOnce();

        assertEquals(List.of("schema"), seeder.calls);
    }

    @Test
    void runnerReturnsPromptlyRetriesTransientFailuresAndStartsOnlyOneDaemon() throws Exception {
        RetryingSeeder seeder = new RetryingSeeder();
        activeSeeder = seeder;

        assertTimeoutPreemptively(Duration.ofSeconds(1), () -> {
            seeder.run(null);
            seeder.run(null);
        });

        assertTrue(seeder.completed.await(2, TimeUnit.SECONDS));
        assertEquals(3, seeder.attempts.get());
        assertTrue(seeder.daemonThread.get());
    }

    private static class RecordingSeeder extends SatQuestionDataSeeder {
        private final List<String> calls = new ArrayList<>();

        RecordingSeeder(boolean enabled) {
            super(
                new JdbcTemplate(),
                new DriverManagerDataSource(),
                new ObjectMapper(),
                enabled,
                new ByteArrayResource(new byte[0]),
                new ByteArrayResource(new byte[0]),
                1,
                4
            );
        }

        @Override
        void applySchema() {
            calls.add("schema");
        }

        @Override
        void synchronizeSeed() {
            calls.add("seed");
        }
    }

    private static class RetryingSeeder extends SatQuestionDataSeeder {
        private final AtomicInteger attempts = new AtomicInteger();
        private final AtomicBoolean daemonThread = new AtomicBoolean(false);
        private final CountDownLatch completed = new CountDownLatch(1);

        RetryingSeeder() {
            super(
                new JdbcTemplate(),
                new DriverManagerDataSource(),
                new ObjectMapper(),
                true,
                new ByteArrayResource(new byte[0]),
                new ByteArrayResource(new byte[0]),
                1,
                4
            );
        }

        @Override
        void synchronizeOnce() {
            daemonThread.set(Thread.currentThread().isDaemon());
            if (attempts.incrementAndGet() < 3) {
                throw new CannotGetJdbcConnectionException("database is starting");
            }
            completed.countDown();
        }
    }
}
