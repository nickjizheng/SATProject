# SAT 答题系统

这是一个完整的SAT题目答题系统，包含前端React界面和后端Spring Boot API。

## 功能特性

### 后端功能
- **题目管理**: 支持从数据库获取SAT题目
- **随机题目**: 可以随机获取指定数量的题目
- **领域筛选**: 支持按题目领域筛选题目
- **答案验证**: 验证用户答案并返回结果
- **RESTful API**: 提供完整的REST API接口

### 前端功能
- **答题界面**: 美观的答题界面，支持题目展示
- **选项选择**: 支持A、B、C、D四个选项的选择
- **实时反馈**: 选择答案后立即显示正确性
- **题目导航**: 支持上一题/下一题导航
- **领域筛选**: 可以按领域筛选题目
- **题目数量**: 可以自定义题目数量（5、10、20、50题）

## 数据库结构

### sat_questions 表
```sql
CREATE TABLE IF NOT EXISTS sat_questions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
    original_id VARCHAR(50) COMMENT '原始题目ID',
    domain VARCHAR(100) COMMENT '题目领域',
    visuals_type VARCHAR(50) COMMENT '视觉类型',
    visuals_svg_content LONGTEXT COMMENT 'SVG内容',
    question_text LONGTEXT COMMENT '题目文本',
    question_paragraph LONGTEXT COMMENT '题目段落',
    question_explanation LONGTEXT COMMENT '题目解释',
    choice_a LONGTEXT COMMENT '选项A',
    choice_b LONGTEXT COMMENT '选项B',
    choice_c LONGTEXT COMMENT '选项C',
    choice_d LONGTEXT COMMENT '选项D',
    correct_answer VARCHAR(10) COMMENT '正确答案 (A, B, C, D)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SAT题目表';
```

## 安装和运行

### 后端 (Spring Boot)

1. 确保MySQL数据库已安装并运行
2. 执行数据库脚本创建表结构
3. 更新 `application.yml` 中的数据库连接配置
4. 运行以下命令启动后端服务：

```bash
cd Java
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 前端 (React)

1. 安装依赖：
```bash
cd SATProject
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

前端应用将在 `http://localhost:5173` 启动

## API 接口

### 获取随机题目
```
GET /api/sat/questions/random?count=10
```

### 根据领域获取题目
```
GET /api/sat/questions/domain/{domain}?count=10
```

### 获取所有领域
```
GET /api/sat/domains
```

### 根据ID获取题目
```
GET /api/sat/questions/{id}
```

### 提交答案
```
POST /api/sat/answer
Content-Type: application/json

{
  "questionId": 1,
  "answer": "A"
}
```

## 使用说明

1. **访问系统**: 在浏览器中访问 `http://localhost:5173`
2. **进入答题**: 点击导航栏中的"SAT练习"按钮
3. **选择设置**: 
   - 选择题目领域（可选）
   - 选择题目数量
   - 点击"重新加载"获取题目
4. **开始答题**:
   - 阅读题目内容
   - 选择你认为正确的答案
   - 点击"提交答案"查看结果
   - 查看题目解释（如果有）
   - 使用"上一题"/"下一题"导航

## 技术栈

### 后端
- Spring Boot 3.3.1
- MyBatis Plus
- MySQL 8.0
- Maven

### 前端
- React 18
- TypeScript
- Ant Design
- Vite

## 注意事项

1. **正确答案字段**: 请确保在数据库中添加 `correct_answer` 字段并填入正确答案
2. **数据准备**: 需要准备SAT题目数据并导入到数据库中
3. **跨域配置**: 前端和后端运行在不同端口，确保CORS配置正确
4. **错误处理**: 系统包含基本的错误处理，但建议根据实际需求完善

## 扩展功能建议

1. **用户系统集成**: 记录用户的答题历史和成绩
2. **题目分类**: 更详细的题目分类和标签
3. **计时功能**: 添加答题时间限制
4. **成绩统计**: 统计答题正确率和用时
5. **题目收藏**: 允许用户收藏重要题目
6. **错题本**: 记录和复习错题
7. **模拟考试**: 完整的模拟考试功能

## 故障排除

### 常见问题

1. **无法获取题目**: 检查数据库连接和表结构
2. **前端无法连接后端**: 检查后端服务是否启动，端口是否正确
3. **答案验证失败**: 检查数据库中的 `correct_answer` 字段是否有值

### 日志查看

后端日志位置：`Java/logs/application.log`
前端控制台：浏览器开发者工具的Console标签
