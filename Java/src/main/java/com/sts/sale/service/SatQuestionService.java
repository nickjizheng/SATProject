package com.sts.sale.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.sts.sale.dto.*;
import com.sts.sale.mapper.SatQuestionMapper;
import com.sts.sale.mapper.UserAnswerRecordMapper;
import com.sts.sale.model.SatQuestion;
import com.sts.sale.model.UserAnswerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SAT题目服务类
 */
@Service
public class SatQuestionService {

    @Autowired
    private SatQuestionMapper satQuestionMapper;

    @Autowired
    private UserAnswerRecordMapper userAnswerRecordMapper;

    /**
     * 获取随机题目
     * @param count 题目数量
     * @return 题目列表
     */
    public List<SatQuestionResponse> getRandomQuestions(int count, Integer userId) {
        List<SatQuestion> questions;
        if (userId != null) {
            questions = userAnswerRecordMapper.getUnansweredQuestionsForUser(userId, null, count);
        } else {
            questions = satQuestionMapper.getRandomQuestions(count);
        }

        return questions.stream()
                .map(SatQuestionResponse::fromSatQuestion)
                .collect(Collectors.toList());
    }

    /**
     * 根据领域获取题目
     * @param domain 题目领域
     * @param count 题目数量
     * @return 题目列表
     */
    public List<SatQuestionResponse> getQuestionsByDomain(String domain, int count, Integer userId) {
        List<SatQuestion> questions;
        if (userId != null) {
            questions = userAnswerRecordMapper.getUnansweredQuestionsForUser(userId, domain, count);
        } else {
            questions = satQuestionMapper.getQuestionsByDomain(domain, count);
        }

        return questions.stream()
                .map(SatQuestionResponse::fromSatQuestion)
                .collect(Collectors.toList());
    }

    /**
     * 获取所有领域
     * @return 领域列表
     */
    public List<String> getAllDomains() {
        return satQuestionMapper.getAllDomains();
    }

    /**
     * 根据ID获取题目
     * @param id 题目ID
     * @return 题目
     */
    public SatQuestionResponse getQuestionById(Integer id) {
        SatQuestion question = satQuestionMapper.selectById(id);
        if (question == null) {
            return null;
        }
        return SatQuestionResponse.fromSatQuestion(question);
    }

    /**
     * Marks a submitted answer against the authoritative answer key.
     * @param request the submitted question ID and answer
     * @return the marking result shown to the student
     */
    public AnswerResponse checkAnswer(AnswerRequest request) {
        // Load the full question so marking always uses the server-side answer key.
        SatQuestion question = satQuestionMapper.selectById(request.getQuestionId());
        if (question == null) {
            throw new RuntimeException("题目不存在");
        }

        AnswerResponse response = new AnswerResponse();
        response.setQuestionId(request.getQuestionId());
        response.setUserAnswer(request.getAnswer());

        String correctAnswer = getVerifiedAnswerKey(question);
        String submittedAnswer = request.getAnswer().trim().toUpperCase();
        if (!submittedAnswer.matches("[A-D]")) {
            throw new IllegalArgumentException("Answer must be A, B, C, or D.");
        }

        // Use one comparison result for both the response and persisted attempt.
        response.setCorrectAnswer(correctAnswer);
        response.setUserAnswer(submittedAnswer);
        response.setIsCorrect(correctAnswer.equals(submittedAnswer));
        response.setExplanation(question.getQuestionExplanation());

        return response;
    }

    private String getVerifiedAnswerKey(SatQuestion question) {
        String answerKey = question.getCorrectAnswer();
        if (answerKey == null || !answerKey.trim().toUpperCase().matches("[A-D]")) {
            throw new IllegalStateException(
                "This question does not have a verified answer key and cannot be scored."
            );
        }
        return answerKey.trim().toUpperCase();
    }

    /**
     * 获取下一道未做过的题目
     * @param request 请求参数
     * @return 下一题响应
     */
    public NextQuestionResponse getNextQuestion(NextQuestionRequest request, Integer userId) {
        List<SatQuestion> unansweredQuestions;
        if (userId != null) {
            unansweredQuestions = userAnswerRecordMapper.getUnansweredQuestionsForUser(
                userId,
                request.getDomain(),
                1
            );
        } else {
            unansweredQuestions = userAnswerRecordMapper.getUnansweredQuestions(
                request.getSessionId(),
                request.getDomain(),
                1
            );
        }

        NextQuestionResponse response = new NextQuestionResponse();

        if (unansweredQuestions.isEmpty()) {
            // 没有未做过的题目了
            response.setQuestion(null);
            response.setHasMoreQuestions(false);
        } else {
            // 有未做过的题目
            SatQuestion question = unansweredQuestions.get(0);
            response.setQuestion(SatQuestionResponse.fromSatQuestion(question));
            response.setHasMoreQuestions(true);
        }

        List<Integer> answeredIds = userId != null
            ? userAnswerRecordMapper.getAnsweredQuestionIdsByUser(userId)
            : userAnswerRecordMapper.getAnsweredQuestionIds(request.getSessionId());
        response.setAnsweredCount(answeredIds.size());

        // 统计总题目数量
        QueryWrapper<SatQuestion> queryWrapper = new QueryWrapper<>();
        queryWrapper.apply("UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D')");
        if (request.getDomain() != null && !request.getDomain().trim().isEmpty()) {
            queryWrapper.eq("domain", request.getDomain());
        }
        Long totalCount = satQuestionMapper.selectCount(queryWrapper);
        response.setTotalCount(totalCount.intValue());

        return response;
    }

    /**
     * Marks an answer and records the latest attempt for synchronization.
     * @param request the submitted answer and optional practice session
     * @param userId the authenticated student, or null for an anonymous session
     * @return the marking result shown to the student
     */
    public AnswerResponse submitAnswerWithRecord(AnswerRequest request, Integer userId) {
        // Mark first so the stored correctness matches the result returned to the UI.
        AnswerResponse answerResponse = checkAnswer(request);

        // Reuse the account/session record so repeat attempts update instead of duplicate.
        UserAnswerRecord record = findExistingAnswerRecord(request, userId);
        boolean isNewRecord = record == null;

        if (isNewRecord) {
            record = new UserAnswerRecord();
            record.setQuestionId(request.getQuestionId());
        }

        // Persist the owner, selected answer, result, timestamp, and practice session.
        record.setUserId(userId);
        record.setUserAnswer(request.getAnswer());
        record.setIsCorrect(answerResponse.getIsCorrect());
        record.setAnsweredAt(LocalDateTime.now());
        record.setSessionId(request.getSessionId());

        // Insert a first attempt or update the shared record used by both practice modes.
        if (isNewRecord) {
            userAnswerRecordMapper.insert(record);
        } else {
            userAnswerRecordMapper.updateById(record);
        }

        return answerResponse;
    }

    /**
     * Rebuilds the marking response for a previously persisted attempt.
     */
    public AnswerResponse getRecordedAnswer(Integer questionId, Integer userId, String sessionId) {
        UserAnswerRecord record;

        if (userId != null) {
            record = userAnswerRecordMapper.findLatestByUserIdAndQuestionId(userId, questionId);
        } else if (sessionId != null && !sessionId.trim().isEmpty()) {
            record = userAnswerRecordMapper.findLatestBySessionIdAndQuestionId(sessionId, questionId);
        } else {
            return null;
        }

        if (record == null) {
            return null;
        }

        AnswerRequest recordedRequest = new AnswerRequest();
        recordedRequest.setQuestionId(questionId);
        recordedRequest.setAnswer(record.getUserAnswer());
        recordedRequest.setSessionId(record.getSessionId());
        return checkAnswer(recordedRequest);
    }

    private UserAnswerRecord findExistingAnswerRecord(AnswerRequest request, Integer userId) {
        if (userId != null) {
            return userAnswerRecordMapper.findLatestByUserIdAndQuestionId(userId, request.getQuestionId());
        }

        if (request.getSessionId() != null && !request.getSessionId().trim().isEmpty()) {
            return userAnswerRecordMapper.findLatestBySessionIdAndQuestionId(request.getSessionId(), request.getQuestionId());
        }

        return null;
    }

    /**
     * 生成新的会话ID
     * @return 会话ID
     */
    public String generateSessionId() {
        return UUID.randomUUID().toString();
    }
}
