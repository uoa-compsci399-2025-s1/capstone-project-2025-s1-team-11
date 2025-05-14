// selectors.js
import { createSelector } from "@reduxjs/toolkit";

// Root selector
export const selectExamState = (state) => state.exam;

// Exam-level selectors
export const selectExamData = (state) => selectExamState(state).examData;
export const selectExamMetadata = (state) => selectExamData(state)?.metadata;
export const selectExamBody = (state) => selectExamData(state)?.examBody;
export const selectExamStatus = (state) => selectExamState(state).status;
export const selectExamError = (state) => selectExamState(state).error;

// Section and question selectors
export const selectSectionByIndex = (state, index) => {
  const body = selectExamBody(state);
  const section = body?.[index];
  return section?.type === 'section' ? section : null;
};

export const selectQuestionByPath = (state, examBodyIndex, questionIndex) => {
  const body = selectExamBody(state);
  const item = body?.[examBodyIndex];

  if (!item) return null;

  if (item.type === 'question') {
    return examBodyIndex === questionIndex ? item : null;
  }

  if (item.type === 'section') {
    return item.questions?.[questionIndex] || null;
  }

  return null;
};

export const selectQuestionByNumber = (state, questionNumber) => {
  if (!state.exam.examData?.examBody) return null;

  for (const item of state.exam.examData.examBody) {
    if (item.type === 'question' && item.questionNumber === questionNumber) {

      return item;
    }

    if (item.type === 'section' && Array.isArray(item.questions)) {
      const found = item.questions.find(q => q.questionNumber === questionNumber);
      if (found) return found;
    }
  }

  return null;
};

// Utility selectors
export const selectAllQuestionsFlat = createSelector(
  [selectExamBody],
  (examBody) => {
    if (!examBody) return [];

    return examBody.flatMap((item) => {
      if (item.type === 'question') return [item];
      if (item.type === 'section') return item.questions || [];
      return [];
    });
  }
);

export const selectTotalMarks = createSelector(
  [selectAllQuestionsFlat],
  (questions) => questions.reduce((sum, q) => sum + (q.marks || 0), 0)
);

export const selectQuestionCount = createSelector(
  [selectAllQuestionsFlat],
  (questions) => questions.length
);

export const selectQuestionsForTable = createSelector(
  [selectExamBody],
  (examBody) => {
    if (!examBody) return [];
    
    const result = [];

    examBody.forEach((item) => {
      if (item.type === 'question') {
        result.push(normaliseQuestionForTable(item, null));
      } else if (item.type === 'section') {
        item.questions?.forEach((q, i) => {
          result.push(normaliseQuestionForTable(q, item.sectionNumber, i));
        });
      }
    });

    return result;
  }
);

// Normaliser to suit UI table display
const normaliseQuestionForTable = (question, sectionNumber = null) => ({
  sectionNumber,
  questionNumber: question.questionNumber,
  questionText: question.contentText || '',
  marks: question.marks || 0,
  answers: question.answers || [],
  correctAnswers: question.correctAnswers || [],
  lockedPositions: question.lockedPositions || { a: false, b: false, c: false, d: false, e: false },
});

export const selectCorrectAnswerIndices = createSelector(
  [selectExamData, selectAllQuestionsFlat],
  (examData, questions) => {
    if (!examData?.versions || !questions.length) return {};

    const result = {};

    // Initialize result structure for each version
    examData.versions.forEach(versionId => {
      result[versionId] = {};
    });

    // For each question
    questions.forEach(question => {
      const questionNumber = question.questionNumber;
      if (!questionNumber) return;

      // Get original correct answer indices
      const originalCorrectIndices = question.answers
        .map((answer, index) => answer.correct ? index : -1)
        .filter(index => index !== -1);

      // For each version, map the original correct indices through the shuffle map
      examData.versions.forEach((versionId, versionIndex) => {
        const shuffleMap = question.answerShuffleMaps?.[versionIndex];
        if (!shuffleMap) return;

        // Map the original correct indices through the shuffle map
        const shuffledCorrectIndices = originalCorrectIndices
          .map(originalIndex => shuffleMap.indexOf(originalIndex))
          .filter(index => index !== -1)
          .sort((a, b) => a - b);

        result[versionId][questionNumber] = shuffledCorrectIndices;
      });
    });

    return result;
  }
);