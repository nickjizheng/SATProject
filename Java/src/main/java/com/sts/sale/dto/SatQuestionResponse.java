package com.sts.sale.dto;

import com.sts.sale.model.SatQuestion;
import lombok.Data;

/**
 * SAT题目响应DTO
 */
@Data
public class SatQuestionResponse {
    
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
    
    public static SatQuestionResponse fromSatQuestion(SatQuestion question) {
        SatQuestionResponse response = new SatQuestionResponse();
        response.setId(question.getId());
        response.setOriginalId(question.getOriginalId());
        response.setDomain(question.getDomain());
        response.setVisualsType(question.getVisualsType());
        response.setVisualsSvgContent(question.getVisualsSvgContent());
        response.setQuestionText(question.getQuestionText());
        response.setQuestionParagraph(question.getQuestionParagraph());
        response.setChoiceA(question.getChoiceA());
        response.setChoiceB(question.getChoiceB());
        response.setChoiceC(question.getChoiceC());
        response.setChoiceD(question.getChoiceD());
        return response;
    }
}
