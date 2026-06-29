package com.sts.sale.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.sts.sale.mapper.*;
import com.sts.sale.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 仪表盘服务类
 */
@Service
public class DashboardService {

    @Autowired
    private UserAnswerRecordMapper userAnswerRecordMapper;

    @Autowired
    private FavoriteQuestionMapper favoriteQuestionMapper;

    @Autowired
    private FavoriteWordMapper favoriteWordMapper;

    @Autowired
    private SatQuestionMapper satQuestionMapper;

    @Autowired
    private UserMapper userMapper;

    /**
     * 获取空统计数据
     */
    private Map<String, Object> getEmptyStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalQuestions", 0);
        stats.put("totalAnswered", 0);
        stats.put("correctAnswers", 0);
        stats.put("accuracy", 0.0);
        stats.put("favoriteQuestions", 0);
        stats.put("favoriteWords", 0);
        stats.put("studyStreak", 0);
        stats.put("averageScore", 0.0);
        stats.put("domainStats", new HashMap<>());
        return stats;
    }

    /**
     * 获取用户学习统计
     * @param userId 用户ID
     * @return 用户统计数据
     */
    public Map<String, Object> getUserStats(Integer userId) {
        Map<String, Object> stats = new HashMap<>();

        List<UserAnswerRecord> allAnswers = getLatestAnswerRecords(userId);
        long totalAnswered = allAnswers.size();

        // Count correct answers
        long correctAnswers = allAnswers.stream().mapToLong(record -> record.getIsCorrect() ? 1 : 0).sum();

        // 获取总题目数
        QueryWrapper<SatQuestion> verifiedQuestionWrapper = new QueryWrapper<>();
        verifiedQuestionWrapper.apply("UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D')");
        Long totalQuestions = satQuestionMapper.selectCount(verifiedQuestionWrapper);

        // 获取收藏题目数
        QueryWrapper<FavoriteQuestion> favoriteQuestionWrapper = new QueryWrapper<>();
        favoriteQuestionWrapper.eq("user_id", userId);
        Long favoriteQuestions = favoriteQuestionMapper.selectCount(favoriteQuestionWrapper);

        // 获取收藏单词数
        QueryWrapper<FavoriteWord> favoriteWordWrapper = new QueryWrapper<>();
        favoriteWordWrapper.eq("user_id", userId);
        Long favoriteWords = favoriteWordMapper.selectCount(favoriteWordWrapper);

        // 计算平均正确率
        double averageScore = totalAnswered > 0 ? (double) correctAnswers / totalAnswered * 100 : 0;

        // 计算学习天数（连续登录天数）
        int studyStreak = calculateStudyStreak(userId);

        // 获取各科目统计
        List<Map<String, Object>> domainStats = getDomainStats(userId);

        stats.put("totalQuestions", totalQuestions);
        stats.put("answeredQuestions", totalAnswered);
        stats.put("correctAnswers", correctAnswers);
        stats.put("favoriteQuestions", favoriteQuestions);
        stats.put("favoriteWords", favoriteWords);
        stats.put("studyStreak", studyStreak);
        stats.put("lastStudyDate", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        stats.put("averageScore", Math.round(averageScore * 10.0) / 10.0);
        stats.put("domainStats", domainStats);

        return stats;
    }

    /**
     * 获取用户最近活动
     * @param userId 用户ID
     * @param limit 限制数量
     * @return 最近活动列表
     */
    public List<Map<String, Object>> getRecentActivities(Integer userId, int limit) {
        List<Map<String, Object>> activities = new ArrayList<>();

        List<UserAnswerRecord> recentAnswers = getLatestAnswerRecords(userId).stream()
                .sorted(Comparator.comparing(UserAnswerRecord::getAnsweredAt).reversed())
                .limit(limit)
                .toList();
        for (UserAnswerRecord record : recentAnswers) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("id", record.getId());
            activity.put("type", "question_answered");
            activity.put("description", String.format("Completed question #%d", record.getQuestionId()));
            activity.put("timestamp", record.getAnsweredAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("questionId", record.getQuestionId());
            metadata.put("correct", record.getIsCorrect());
            activity.put("metadata", metadata);

            activities.add(activity);
        }

        // 获取最近收藏的题目
        QueryWrapper<FavoriteQuestion> favoriteQuestionWrapper = new QueryWrapper<>();
        favoriteQuestionWrapper.eq("user_id", userId)
                              .orderByDesc("created_at")
                              .last("LIMIT " + (limit / 2));

        List<FavoriteQuestion> recentFavoriteQuestions = favoriteQuestionMapper.selectList(favoriteQuestionWrapper);
        for (FavoriteQuestion favorite : recentFavoriteQuestions) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("id", favorite.getId());
            activity.put("type", "favorite_added");
            activity.put("description", String.format("Saved question #%d", favorite.getQuestionId()));
            activity.put("timestamp", favorite.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("questionId", favorite.getQuestionId());
            activity.put("metadata", metadata);

            activities.add(activity);
        }

        // 获取最近收藏的单词
        QueryWrapper<FavoriteWord> favoriteWordWrapper = new QueryWrapper<>();
        favoriteWordWrapper.eq("user_id", userId)
                          .orderByDesc("created_at")
                          .last("LIMIT " + (limit / 2));

        List<FavoriteWord> recentFavoriteWords = favoriteWordMapper.selectList(favoriteWordWrapper);
        for (FavoriteWord favorite : recentFavoriteWords) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("id", favorite.getId());
            activity.put("type", "favorite_added");
            activity.put("description", String.format("Saved the word \"%s\"", favorite.getWord()));
            activity.put("timestamp", favorite.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("word", favorite.getWord());
            activity.put("metadata", metadata);

            activities.add(activity);
        }

        // 按时间排序并限制数量
        activities.sort((a, b) -> {
            String timeA = (String) a.get("timestamp");
            String timeB = (String) b.get("timestamp");
            return timeB.compareTo(timeA);
        });

        return activities.size() > limit ? activities.subList(0, limit) : activities;
    }

    /**
     * 获取用户学习进度
     * @param userId 用户ID
     * @param days 天数
     * @return 学习进度数据
     */
    public List<Map<String, Object>> getStudyProgress(Integer userId, int days) {
        List<Map<String, Object>> progress = new ArrayList<>();

        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(days - 1);
        List<UserAnswerRecord> latestAnswers = getLatestAnswerRecords(userId);

        for (int i = 0; i < days; i++) {
            LocalDateTime currentDate = startDate.plusDays(i);
            LocalDateTime nextDate = currentDate.plusDays(1);

            List<UserAnswerRecord> dayAnswers = latestAnswers.stream()
                    .filter(record -> !record.getAnsweredAt().isBefore(currentDate) && record.getAnsweredAt().isBefore(nextDate))
                    .toList();
            int questionsAnswered = dayAnswers.size();
            int correctAnswers = (int) dayAnswers.stream().mapToLong(record -> record.getIsCorrect() ? 1 : 0).sum();

            Map<String, Object> dayProgress = new HashMap<>();
            dayProgress.put("date", currentDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
            dayProgress.put("questionsAnswered", questionsAnswered);
            dayProgress.put("correctAnswers", correctAnswers);
            dayProgress.put("studyTime", questionsAnswered * 2); // 假设每题2分钟

            progress.add(dayProgress);
        }

        return progress;
    }

    /**
     * 计算学习天数
     * @param userId 用户ID
     * @return 学习天数
     */
    private int calculateStudyStreak(Integer userId) {
        List<UserAnswerRecord> records = getLatestAnswerRecords(userId);
        if (records.isEmpty()) {
            return 0;
        }

        // Use a Set to store unique study dates, so repeated records from the same day
        Set<String> studyDays = new HashSet<>();
        for (UserAnswerRecord record : records) {
            // Extracting the date
            String date = record.getAnsweredAt().toLocalDate().toString();
            studyDays.add(date);
        }

        // Return number of study days.
        return studyDays.size();
    }

    /**
     * 获取各科目统计
     * @param userId 用户ID
     * @return 各科目统计数据
     */
    private List<Map<String, Object>> getDomainStats(Integer userId) {
        List<Map<String, Object>> domainStats = new ArrayList<>();
        List<String> domains = satQuestionMapper.getAllDomains();
        List<UserAnswerRecord> allUserAnswers = getLatestAnswerRecords(userId);

        for (String domain : domains) {
            QueryWrapper<SatQuestion> questionWrapper = new QueryWrapper<>();
            questionWrapper.eq("domain", domain)
                           .apply("UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D')");
            Long totalQuestions = satQuestionMapper.selectCount(questionWrapper);

            List<UserAnswerRecord> domainUserAnswers = new ArrayList<>();
            for (UserAnswerRecord record : allUserAnswers) {
                SatQuestion question = satQuestionMapper.selectById(record.getQuestionId());
                if (question != null && domain.equals(question.getDomain())) {
                    domainUserAnswers.add(record);
                }
            }

            int answeredQuestions = domainUserAnswers.size();
            int correctAnswers = (int) domainUserAnswers.stream().mapToLong(record -> record.getIsCorrect() ? 1 : 0).sum();
            double averageScore = answeredQuestions > 0 ? (double) correctAnswers / answeredQuestions * 100 : 0;

            Map<String, Object> domainStat = new HashMap<>();
            domainStat.put("domain", domain);
            domainStat.put("totalQuestions", totalQuestions);
            domainStat.put("answeredQuestions", answeredQuestions);
            domainStat.put("correctAnswers", correctAnswers);
            domainStat.put("averageScore", Math.round(averageScore * 10.0) / 10.0);

            domainStats.add(domainStat);
        }

        return domainStats;
    }

    private List<UserAnswerRecord> getLatestAnswerRecords(Integer userId) {
        QueryWrapper<UserAnswerRecord> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId)
               .orderByDesc("answered_at")
               .orderByDesc("id");

        List<UserAnswerRecord> records = userAnswerRecordMapper.selectList(wrapper);
        Map<Integer, UserAnswerRecord> latestByQuestion = new LinkedHashMap<>();
        for (UserAnswerRecord record : records) {
            SatQuestion question = satQuestionMapper.selectById(record.getQuestionId());
            if (question == null || question.getCorrectAnswer() == null) {
                continue;
            }

            String answerKey = question.getCorrectAnswer().trim().toUpperCase();
            if (!answerKey.matches("[A-D]")) {
                continue;
            }

            String userAnswer = record.getUserAnswer() == null ? "" : record.getUserAnswer().trim().toUpperCase();
            record.setIsCorrect(answerKey.equals(userAnswer));
            latestByQuestion.putIfAbsent(record.getQuestionId(), record);
        }

        return new ArrayList<>(latestByQuestion.values());
    }
}
