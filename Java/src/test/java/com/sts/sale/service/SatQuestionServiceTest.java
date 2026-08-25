package com.sts.sale.service;

import com.sts.sale.dto.AnswerRequest;
import com.sts.sale.dto.AnswerResponse;
import com.sts.sale.mapper.QuestionAttemptMapper;
import com.sts.sale.mapper.SatQuestionMapper;
import com.sts.sale.mapper.UserAnswerRecordMapper;
import com.sts.sale.mapper.UserQuestionReviewStateMapper;
import com.sts.sale.model.QuestionAttempt;
import com.sts.sale.model.SatQuestion;
import com.sts.sale.model.UserAnswerRecord;
import com.sts.sale.model.UserQuestionReviewState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SatQuestionServiceTest {

    @Mock
    private SatQuestionMapper satQuestionMapper;
    @Mock
    private UserAnswerRecordMapper userAnswerRecordMapper;
    @Mock
    private QuestionAttemptMapper questionAttemptMapper;
    @Mock
    private UserQuestionReviewStateMapper reviewStateMapper;

    private SatQuestionService service;

    @BeforeEach
    void setUp() {
        service = new SatQuestionService(
            satQuestionMapper,
            userAnswerRecordMapper,
            questionAttemptMapper,
            reviewStateMapper,
            new ReviewIntervalPolicy()
        );
    }

    @Test
    void scoringRejectsAQuestionOutsideTheQualityGate() {
        AnswerRequest request = request("submission-1");
        when(satQuestionMapper.selectUsableById(42)).thenReturn(null);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.checkAnswer(request)
        );

        assertTrue(exception.getMessage().contains("quality screen"));
        verifyNoInteractions(questionAttemptMapper, userAnswerRecordMapper, reviewStateMapper);
    }

    @Test
    void authenticatedSubmissionAppendsAttemptAndCreatesReviewSchedule() {
        AnswerRequest request = request("submission-2");
        when(satQuestionMapper.selectUsableById(42)).thenReturn(question());
        when(questionAttemptMapper.findBySubmissionId("submission-2")).thenReturn(null);
        when(reviewStateMapper.findForUpdate(7L, 42)).thenReturn(null);
        when(questionAttemptMapper.insertIfAbsent(any())).thenAnswer(invocation -> {
            QuestionAttempt attempt = invocation.getArgument(0);
            attempt.setId(91L);
            return 1;
        });
        when(userAnswerRecordMapper.findLatestByUserIdAndQuestionId(7, 42)).thenReturn(null);

        AnswerResponse response = service.submitAnswerWithRecord(request, 7L);

        assertTrue(response.getIsCorrect());
        assertEquals(1, response.getReviewStage());
        assertEquals(1440L, response.getIntervalMinutes());
        assertNotNull(response.getNextReviewAt());

        ArgumentCaptor<QuestionAttempt> attemptCaptor = ArgumentCaptor.forClass(QuestionAttempt.class);
        verify(questionAttemptMapper).insertIfAbsent(attemptCaptor.capture());
        assertEquals(7L, attemptCaptor.getValue().getUserId());
        assertEquals(1, attemptCaptor.getValue().getDefaultStage());
        assertEquals(91L, attemptCaptor.getValue().getId());

        ArgumentCaptor<UserQuestionReviewState> stateCaptor =
            ArgumentCaptor.forClass(UserQuestionReviewState.class);
        verify(reviewStateMapper).save(stateCaptor.capture());
        assertEquals(91L, stateCaptor.getValue().getLastAttemptId());
        assertEquals(1, stateCaptor.getValue().getCorrectStreak());
        assertEquals(1, stateCaptor.getValue().getTotalAttempts());
        verify(userAnswerRecordMapper).insert(any(UserAnswerRecord.class));
    }

    @Test
    void anonymousSubmissionIsRecordedWithoutPersonalReviewState() {
        AnswerRequest request = request("submission-3");
        request.setAnswer("A");
        when(satQuestionMapper.selectUsableById(42)).thenReturn(question());
        when(questionAttemptMapper.findBySubmissionId("submission-3")).thenReturn(null);
        when(questionAttemptMapper.insertIfAbsent(any())).thenAnswer(invocation -> {
            QuestionAttempt attempt = invocation.getArgument(0);
            attempt.setId(92L);
            return 1;
        });
        when(userAnswerRecordMapper.findLatestBySessionIdAndQuestionId("session-1", 42))
            .thenReturn(null);

        AnswerResponse response = service.submitAnswerWithRecord(request, null);

        assertFalse(response.getIsCorrect());
        assertNull(response.getReviewStage());
        assertNull(response.getNextReviewAt());
        verify(userAnswerRecordMapper).insert(any(UserAnswerRecord.class));
        verifyNoInteractions(reviewStateMapper);
    }

    @Test
    void repeatedSubmissionIdReturnsStoredResultWithoutWritingAgain() {
        AnswerRequest request = request("submission-4");
        QuestionAttempt stored = new QuestionAttempt();
        stored.setId(93L);
        stored.setSubmissionId("submission-4");
        stored.setUserId(7L);
        stored.setSessionId("session-1");
        stored.setQuestionId(42);
        stored.setUserAnswer("B");
        stored.setIsCorrect(true);
        stored.setDefaultStage(2);
        stored.setSubmittedAt(LocalDateTime.of(2026, 8, 25, 10, 0));
        stored.setDefaultNextReviewAt(LocalDateTime.of(2026, 8, 28, 10, 0));
        when(satQuestionMapper.selectUsableById(42)).thenReturn(question());
        when(questionAttemptMapper.findBySubmissionId("submission-4")).thenReturn(stored);

        AnswerResponse response = service.submitAnswerWithRecord(request, 7L);

        assertTrue(response.getIsCorrect());
        assertEquals(2, response.getReviewStage());
        assertEquals(4320L, response.getIntervalMinutes());
        verify(questionAttemptMapper, never()).insertIfAbsent(any());
        verifyNoInteractions(userAnswerRecordMapper, reviewStateMapper);
    }

    private AnswerRequest request(String submissionId) {
        AnswerRequest request = new AnswerRequest();
        request.setQuestionId(42);
        request.setAnswer("B");
        request.setSessionId("session-1");
        request.setSubmissionId(submissionId);
        request.setStudyMode("practice");
        request.setResponseTimeMs(1200L);
        return request;
    }

    private SatQuestion question() {
        SatQuestion question = new SatQuestion();
        question.setId(42);
        question.setCorrectAnswer("B");
        question.setQuestionExplanation("Because B is correct.");
        return question;
    }
}
