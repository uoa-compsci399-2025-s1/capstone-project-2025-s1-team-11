// src/utils/convertExamXmlToJson.js

import Exam from "../models/Exam.js";
import { Question } from "../models/Question.js";

/**
 * Converts an ExamXmlDTO instance into the JSON model instance.
 */
export function convertExamXmlDTOToJson(examXmlDTO) {
    const questions = examXmlDTO.questions.map(
        (qXml) => new Question(qXml.id, qXml.text, qXml.answer, qXml.options)
    );
    return new Exam(examXmlDTO.title, examXmlDTO.date, questions);
}