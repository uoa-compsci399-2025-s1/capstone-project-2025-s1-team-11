// selectors.js
import { createSelector } from "@reduxjs/toolkit";
import { normaliseVersionId } from "../../utilities/textUtils";

// Root selector
export const selectExamState = (state) => state.exam;

// Exam-level selectors
export const selectExamData = (state) => selectExamState(state).examData;
export const selectExamMetadata = (state) => selectExamData(state)?.metadata;
export const selectExamBody = (state) => selectExamData(state)?.examBody;
export const selectExamStatus = (state) => selectExamState(state).status;
export const selectExamError = (state) => selectExamState(state).error;
export const selectExamIsLoading = (state) => selectExamState(state).isLoading;

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

/**
 * Selects the total number of questions in the exam
 */
export const selectQuestionCount = createSelector(
  [selectExamData],
  (examData) => {
    if (!examData?.examBody) return 0;
    
    return examData.examBody.reduce((count, item) => {
      if (item.type === 'question') {
        return count + 1;
      } else if (item.type === 'section' && Array.isArray(item.questions)) {
        return count + item.questions.length;
      }
      return count;
    }, 0);
  }
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
        item.questions?.forEach((q) => {
          result.push(normaliseQuestionForTable(q, item.sectionNumber));
        });
      }
    });

    return result;
  }
);

export const selectQuestionsAndSectionsForTable = createSelector(
  [selectExamBody],
  (examBody) => {
    if (!examBody) return [];
    
    const result = [];
    let currentSectionNumber = 1;

    examBody.forEach((item, examBodyIndex) => {
      if (item.type === 'section') {
        // Add section row
        result.push({
          id: item.id,
          type: 'section',
          sectionNumber: item.sectionNumber || currentSectionNumber,
          sectionTitle: item.sectionTitle,
          contentFormatted: item.contentFormatted,
          examBodyIndex,
        });

        // Add all questions in this section
        item.questions?.forEach((question, questionsIndex) => {
          result.push({
            ...normaliseQuestionForTable(question, item.sectionNumber || currentSectionNumber, item.sectionTitle),
            examBodyIndex,
            questionsIndex,
            id: question.id,
          });
        });

        currentSectionNumber++;
      } else if (item.type === 'question') {
        // Add standalone question
        result.push({
          ...normaliseQuestionForTable(item),
          examBodyIndex,
          id: item.id,
        });
      }
    });

    return result;
  }
);

// Update the normaliseQuestionForTable function to handle more fields
const normaliseQuestionForTable = (question, sectionNumber = null, sectionTitle = null) => ({
  type: 'question',
  sectionNumber,
  sectionTitle,
  questionNumber: question.questionNumber,
  contentFormatted: question.contentFormatted || '',
  marks: question.marks || 0,
  answers: (question.answers || []).map(answer => ({
    ...answer,
    contentFormatted: answer.contentFormatted || ''
  })),
});

export const selectCorrectAnswerIndices = createSelector(
  [selectExamData, selectAllQuestionsFlat],
  (examData, questions) => {
    if (!examData?.versions || !questions.length) return {};

    const result = {};

    // initialise result structure for each version
    examData.versions.forEach(versionId => {
      const normalisedVersionId = normaliseVersionId(versionId);
      result[normalisedVersionId] = {};
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
          .map(originalIndex => shuffleMap[originalIndex])
          .filter(index => index !== -1)
          .sort((a, b) => a - b);

        const normalisedVersionId = normaliseVersionId(versionId);
        result[normalisedVersionId][questionNumber] = shuffledCorrectIndices;
      });
    });

    return result;
  }
);

// Selector to get correct answer indices for a specific question (original order, not shuffled)
export const selectQuestionCorrectAnswers = createSelector(
  [
    (state, examBodyIndex, questionsIndex) => selectQuestionByPath(state, examBodyIndex, questionsIndex)
  ],
  (question) => {
    if (!question?.answers) return [];
    
    return question.answers
      .map((answer, index) => answer.correct ? index : -1)
      .filter(index => index !== -1);
  }
);

// Other simple selectors
export const selectTeleformData = (state) => state.teleform?.teleformData || '';
export const selectCoverPage = (state) => state.exam?.coverPage || null;
export const selectFileName = (state) => state.exam?.fileName || null;