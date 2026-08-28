package com.sts.sale.config;

import com.sts.sale.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.ServerHttpResponse;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class ApiResponseStatusAdviceTest {

    private final ApiResponseStatusAdvice advice = new ApiResponseStatusAdvice();

    @Test
    void appliesErrorCodeAsHttpStatus() {
        ApiResponse<Void> body = ApiResponse.error(409, "Already saved");
        RecordingServerHttpResponse response = new RecordingServerHttpResponse();

        Object returned = advice.beforeBodyWrite(body, null, null, null, null, response);

        assertSame(body, returned);
        assertSame(HttpStatusCode.valueOf(409), response.statusCode);
    }

    @Test
    void leavesSuccessfulResponseStatusUntouched() {
        ApiResponse<String> body = ApiResponse.success("ok");
        RecordingServerHttpResponse response = new RecordingServerHttpResponse();

        Object returned = advice.beforeBodyWrite(body, null, null, null, null, response);

        assertSame(body, returned);
        assertNull(response.statusCode);
    }

    private static final class RecordingServerHttpResponse implements ServerHttpResponse {
        private final HttpHeaders headers = new HttpHeaders();
        private final ByteArrayOutputStream body = new ByteArrayOutputStream();
        private HttpStatusCode statusCode;

        @Override
        public void setStatusCode(HttpStatusCode status) {
            this.statusCode = status;
        }

        @Override
        public HttpHeaders getHeaders() {
            return headers;
        }

        @Override
        public OutputStream getBody() {
            return body;
        }

        @Override
        public void flush() throws IOException {
            body.flush();
        }

        @Override
        public void close() {
            // ByteArrayOutputStream does not hold external resources.
        }
    }
}
