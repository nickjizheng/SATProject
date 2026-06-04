package com.sts.sale.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * SAT题目模型
 */
@Data
@TableName("sat_questions")
public class SatQuestion {
    
    @TableId(type = IdType.AUTO)
    private Integer id;
    
    /**
     * 原始题目ID
     */
    private String originalId;
    
    /**
     * 题目领域
     */
    private String domain;
    
    /**
     * 视觉类型
     */
    private String visualsType;
    
    /**
     * SVG内容
     */
    private String visualsSvgContent;
    
    /**
     * 题目文本
     */
    private String questionText;
    
    /**
     * 题目段落
     */
    private String questionParagraph;
    
    /**
     * 题目解释
     */
    private String questionExplanation;
    
    /**
     * 选项A
     */
    private String choiceA;
    
    /**
     * 选项B
     */
    private String choiceB;
    
    /**
     * 选项C
     */
    private String choiceC;
    
    /**
     * 选项D
     */
    private String choiceD;
    
    /**
     * 正确答案
     */
    private String correctAnswer;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
}
