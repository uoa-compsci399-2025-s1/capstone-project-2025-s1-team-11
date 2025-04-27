// NEWdocxParser.js

/* eslint-env node */

const { Document, Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");

const parseDocxFile = async (filePath) => {
    const data = fs.readFileSync(filePath);
    const { value: html } = await mammoth.convertToHtml({ buffer: data });

    const blocks = html.split(/<p[^>]*>|<\/p>/g).filter(Boolean);
    const questions = [];
    let sectionNo = null;
    let currentQuestion = null;
    let inAnswers = false;

    const isBookmark = (line) => /bookmark/i.test(line);
    const isSectionBreak = (line) => /Section Break/i.test(line);
    const isMarksLine = (line) => /\[\d+ mark\]/i.test(line);
    const isAnswerOption = (line) => /^[A-E][.)]|^All|^None/i.test(line.trim());
    const isSoftReturn = (line) => line.includes("<br />");
    const isImage = (line) => /<img/i.test(line);
    const isEndOfQuestion = (line) => /<\/p>\s*<\/p>/i.test(line);

    const initQuestion = (sectionNo) => ({
        sectionNo,
        questionNo: questions.length + 1,
        marks: 1,
        questionText: "",
        answers: [],
        correctAnswers: [],
        supplementalHtml: ""
    });

    const cleanText = (line) => line.replace(/<[^>]+>/g, "").trim();
    const extractMarks = (line) => parseInt(line.match(/\[(\d+) mark\]/i)?.[1] || "1");
    const cleanAnswer = (line) => line.replace(/<[^>]+>/g, "").trim();

    const splitAnswersFromBlock = (block) => {
        const clean = cleanText(block);
        return clean.split(/(?=^[A-E][.)]\s+)/m).filter(Boolean);
    };

    const getCorrectAnswers = (answers) => {
        const result = new Array(answers.length).fill(0);
        result[0] = 1;
        const last = answers[answers.length - 1]?.toLowerCase();
        if (/all|none of the above/.test(last)) {
            result.fill(0);
            result[answers.length - 1] = 1;
        }
        return result;
    };

    for (const block of blocks) {
        if (isSectionBreak(block)) {
            sectionNo = questions.length + 1;
            continue;
        }

        if (isBookmark(block)) {
            if (currentQuestion) questions.push(currentQuestion);
            currentQuestion = initQuestion(sectionNo);
            inAnswers = false;
            continue;
        }

        if (!currentQuestion) continue;

        if (isMarksLine(block)) {
            currentQuestion.marks = extractMarks(block);
            currentQuestion.questionText += " " + cleanText(block);
            continue;
        }

        if (isImage(block)) {
            currentQuestion.supplementalHtml += block;
            continue;
        }

        const possibleAnswers = splitAnswersFromBlock(block);
        if (possibleAnswers.length >= 3) {
            currentQuestion.answers.push(...possibleAnswers);
            inAnswers = true;
            continue;
        }

        if (inAnswers && isEndOfQuestion(block)) {
            currentQuestion.correctAnswers = getCorrectAnswers(currentQuestion.answers);
            continue;
        }

        if (!inAnswers) {
            currentQuestion.questionText += (isSoftReturn(block) ? "<br/>" : " ") + cleanText(block);
        }
    }

    if (currentQuestion) questions.push(currentQuestion);

    return questions;
};

module.exports = { parseDocxFile };