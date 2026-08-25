package com.sts.sale.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewQueueRow {
    private Integer id;
    private String originalId;
    private String domain;
    private String visualsType;
    private String visualsSvgContent;
    private String questionText;
    private String questionParagraph;
    private String choiceA;
    private String choiceB;
    private String choiceC;
    private String choiceD;
    private Integer reviewStage;
    private LocalDateTime nextReviewAt;
    private LocalDateTime lastAnsweredAt;
    private Boolean lastCorrect;
    private Integer correctStreak;
    private Integer lapseCount;
    private Integer totalAttempts;

    public SatQuestion toSatQuestion() {
        SatQuestion question = new SatQuestion();
        question.setId(id);
        question.setOriginalId(originalId);
        question.setDomain(domain);
        question.setVisualsType(visualsType);
        question.setVisualsSvgContent(visualsSvgContent);
        question.setQuestionText(questionText);
        question.setQuestionParagraph(questionParagraph);
        question.setChoiceA(choiceA);
        question.setChoiceB(choiceB);
        question.setChoiceC(choiceC);
        question.setChoiceD(choiceD);
        return question;
    }
}
