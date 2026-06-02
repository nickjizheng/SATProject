# SAT 单题模式功能实现

## 功能概述

实现了您要求的单题模式功能：
- ✅ 每次加载1道题
- ✅ 只加载没做过的题
- ✅ 展示题干和选项
- ✅ 用户选择后展示对错
- ✅ 展示答案
- ✅ 可以点击下一题加载新题

## 技术实现

### 1. 数据库层面

#### 新增答题记录表
```sql
-- 执行 create_user_answer_records.sql
CREATE TABLE IF NOT EXISTS user_answer_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT '用户ID（暂时可以为空）',
    question_id INT NOT NULL COMMENT '题目ID',
    user_answer VARCHAR(10) COMMENT '用户答案 (A, B, C, D)',
    is_correct BOOLEAN COMMENT '是否正确',
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100) COMMENT '会话ID（用于临时用户）',
    INDEX idx_session_question (session_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. 后端API

#### 新增接口
- `POST /api/sat/session` - 生成新的会话ID
- `POST /api/sat/next-question` - 获取下一道未做过的题目
- `POST /api/sat/submit-answer` - 提交答案并记录

#### 核心逻辑
- 使用会话ID跟踪用户答题状态
- 查询时排除已做过的题目
- 自动记录答题结果

### 3. 前端实现

#### 新增页面
- `SatSingleQuestionPage.tsx` - 单题模式主页面
- 更新了 `SatQuestionCard.tsx` 支持答案展示控制

#### 核心功能
- 会话管理：自动生成和管理会话ID
- 进度跟踪：显示答题进度和统计
- 状态管理：控制答案显示时机
- 领域筛选：支持按领域筛选题目

## 使用流程

### 1. 数据库准备
```bash
# 执行建表脚本
mysql -u root -p < create_user_answer_records.sql

# 插入示例数据（如果还没有）
mysql -u root -p < insert_sample_sat_questions.sql
```

### 2. 启动服务
```bash
# 后端
cd Java && mvn spring-boot:run

# 前端
cd SATProject && npm run dev
```

### 3. 使用单题模式
1. 访问 `http://localhost:5173/sat-single`
2. 选择领域（可选）
3. 系统自动加载第一道未做过的题目
4. 选择答案并提交
5. 查看对错和解释
6. 点击"下一题"继续

## 功能特性

### 🎯 智能题目管理
- **避免重复**: 自动跳过已做过的题目
- **随机顺序**: 未做过的题目随机出现
- **领域筛选**: 支持按数学、英语、模拟测试筛选

### 📊 进度跟踪
- **实时统计**: 显示已做题目数和总题目数
- **进度条**: 可视化答题进度
- **完成提示**: 所有题目完成后给出提示

### 🔄 会话管理
- **自动生成**: 每次访问自动创建会话ID
- **状态保持**: 在同一会话中保持答题记录
- **重新开始**: 可以重新开始新的答题会话

### 💡 用户体验
- **即时反馈**: 选择答案后立即显示对错
- **详细解释**: 显示正确答案和题目解释
- **流畅导航**: 一键进入下一题

## API接口详情

### 获取下一题
```typescript
POST /api/sat/next-question
{
  "sessionId": "uuid-string",
  "domain": "math" // 可选
}

// 响应
{
  "success": true,
  "data": {
    "question": { /* 题目信息 */ },
    "hasMoreQuestions": true,
    "answeredCount": 5,
    "totalCount": 20
  }
}
```

### 提交答案
```typescript
POST /api/sat/submit-answer
{
  "questionId": 1,
  "answer": "A",
  "sessionId": "uuid-string"
}

// 响应
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": "A",
    "userAnswer": "A",
    "explanation": "题目解释..."
  }
}
```

## 文件结构

### 新增文件
```
Java/
├── database/
│   └── create_user_answer_records.sql    # 答题记录表
├── src/main/java/com/sts/sale/
│   ├── model/
│   │   └── UserAnswerRecord.java         # 答题记录模型
│   ├── mapper/
│   │   └── UserAnswerRecordMapper.java   # 答题记录Mapper
│   └── dto/
│       ├── NextQuestionRequest.java      # 获取下一题请求
│       └── NextQuestionResponse.java     # 获取下一题响应

SATProject/src/
├── pages/
│   └── SatSingleQuestionPage.tsx        # 单题模式页面
└── types/
    └── sat.ts                            # 更新类型定义
```

### 修改文件
- `SatQuestionService.java` - 添加单题模式逻辑
- `SatQuestionController.java` - 添加新API接口
- `SatQuestionCard.tsx` - 支持答案展示控制
- `Navigation.tsx` - 添加单题模式链接
- `App.tsx` - 添加路由配置

## 与原有功能的区别

| 功能 | 原有多题模式 | 新单题模式 |
|------|-------------|------------|
| 题目加载 | 一次加载多题 | 一次加载一题 |
| 重复题目 | 可能重复 | 避免重复 |
| 答题记录 | 不记录 | 自动记录 |
| 进度跟踪 | 无 | 实时统计 |
| 会话管理 | 无 | 自动管理 |
| 用户体验 | 基础 | 优化 |

## 扩展建议

1. **用户系统集成**: 将临时会话ID替换为真实用户ID
2. **错题本功能**: 记录和复习错题
3. **成绩统计**: 统计正确率和用时
4. **题目收藏**: 允许收藏重要题目
5. **计时功能**: 添加答题时间限制
6. **难度分级**: 根据正确率调整题目难度

## 测试建议

1. **功能测试**: 验证单题加载、答案记录、进度统计
2. **数据测试**: 确保不会重复出现已做过的题目
3. **会话测试**: 验证会话ID的正确管理
4. **边界测试**: 测试所有题目完成后的状态
5. **性能测试**: 验证大量题目时的查询性能

现在您可以使用单题模式进行SAT练习了！系统会自动跟踪您的答题进度，确保不会重复做同一道题目。
