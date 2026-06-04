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
    public List<SatQuestionResponse> getRandomQuestions(int count) {
        List<SatQuestion> questions = satQuestionMapper.getRandomQuestions(count);
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
    public List<SatQuestionResponse> getQuestionsByDomain(String domain, int count) {
        List<SatQuestion> questions = satQuestionMapper.getQuestionsByDomain(domain, count);
        return questions.stream()
                .map(SatQuestionResponse::fromSatQuestion)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取所有领域
     * @return 领域列表
     */
    public List<String> getAllDomains() {
        List<String> domains = satQuestionMapper.getAllDomains();
        System.out.println("从数据库获取到的领域: " + domains);
        return domains;
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
     * 验证答案
     * @param request 答题请求
     * @return 答题响应
     */
    public AnswerResponse checkAnswer(AnswerRequest request) {
        SatQuestion question = satQuestionMapper.selectById(request.getQuestionId());
        if (question == null) {
            throw new RuntimeException("题目不存在");
        }
        
        AnswerResponse response = new AnswerResponse();
        response.setQuestionId(request.getQuestionId());
        response.setUserAnswer(request.getAnswer());
        
        // 从数据库获取正确答案
        String correctAnswer = question.getCorrectAnswer();
        if (correctAnswer == null || correctAnswer.trim().isEmpty()) {
            // 如果数据库中没有正确答案，使用临时逻辑
            correctAnswer = determineCorrectAnswer(question);
        }
        
        response.setCorrectAnswer(correctAnswer);
        response.setIsCorrect(correctAnswer.equalsIgnoreCase(request.getAnswer()));
        response.setExplanation(question.getQuestionExplanation());
        
        return response;
    }
    
    /**
     * 确定正确答案（临时实现）
     * 当数据库中没有正确答案时使用
     */
    private String determineCorrectAnswer(SatQuestion question) {
        // 这里是一个临时的实现，实际应用中应该从数据库获取正确答案
        // 可以根据题目ID或其他逻辑来确定正确答案
        // 为了演示，我们随机返回一个答案
        String[] answers = {"A", "B", "C", "D"};
        int index = question.getId() % 4;
        return answers[index];
    }
    
    /**
     * 获取下一道未做过的题目
     * @param request 请求参数
     * @return 下一题响应
     */
    public NextQuestionResponse getNextQuestion(NextQuestionRequest request) {
        // 获取未做过的题目
        List<SatQuestion> unansweredQuestions = userAnswerRecordMapper.getUnansweredQuestions(
            request.getSessionId(), 
            request.getDomain(), 
            1
        );
        
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
        
        // 统计已做题目数量
        List<Integer> answeredIds = userAnswerRecordMapper.getAnsweredQuestionIds(request.getSessionId());
        response.setAnsweredCount(answeredIds.size());
        
        // 统计总题目数量
        QueryWrapper<SatQuestion> queryWrapper = new QueryWrapper<>();
        if (request.getDomain() != null && !request.getDomain().trim().isEmpty()) {
            queryWrapper.eq("domain", request.getDomain());
        }
        Long totalCount = satQuestionMapper.selectCount(queryWrapper);
        response.setTotalCount(totalCount.intValue());
        
        return response;
    }
    
    /**
     * 提交答案并记录
     * @param request 答题请求
     * @param userId 用户ID
     * @return 答题响应
     */
    public AnswerResponse submitAnswerWithRecord(AnswerRequest request, Integer userId) {
        // 验证答案
        AnswerResponse answerResponse = checkAnswer(request);
        
        // 记录答题记录
        UserAnswerRecord record = new UserAnswerRecord();
        record.setUserId(userId); // 使用用户ID而不是sessionId
        record.setQuestionId(request.getQuestionId());
        record.setUserAnswer(request.getAnswer());
        record.setIsCorrect(answerResponse.getIsCorrect());
        record.setAnsweredAt(LocalDateTime.now());
        record.setSessionId(request.getSessionId()); // 保留sessionId作为备用
        
        userAnswerRecordMapper.insert(record);
        
        return answerResponse;
    }
    
    /**
     * 生成新的会话ID
     * @return 会话ID
     */
    public String generateSessionId() {
        return UUID.randomUUID().toString();
    }
}
