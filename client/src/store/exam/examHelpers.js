// examHelpers.js

import { createAnswer } from "./examUtils";

/**
 * Locates a question or section inside the examBody using location object.
 * @param {Array} examBody - The top-level examBody array.
 * @param {Object} location - Object with examBodyIndex and optional sectionIndex.
 * @returns {Object|null} - The found question object, or null if not found.
 */
 
  /**
   * Updates a question object at the given location.
   * Mutates the original examBody.
   */
  export const updateQuestionHelper = (examBody, location, newData) => {
    const { examBodyIndex, sectionIndex } = location;
    const container = examBody?.[examBodyIndex];
  
    if (!container) return;
  
    if (sectionIndex !== undefined && container.type === 'section') {
      Object.assign(container.questions[sectionIndex], newData);
    } else if (container.type === 'question') {
      Object.assign(container, newData);
    }
  };
  
/**
 * Removes a question from examBody at the given location using the new location format.
 * Mutates the original examBody.
 */
export const removeQuestionHelper = (state, location) => {
  const { examBodyIndex, questionsIndex } = location;
  const examBody = state.examData?.examBody;
  if (!examBody || typeof examBodyIndex !== "number") return;

  const target = examBody[examBodyIndex];

  if (target.type === "section" && typeof questionsIndex === "number") {
    target.questions.splice(questionsIndex, 1);
  } else if (target.type === "question") {
    examBody.splice(examBodyIndex, 1);
  }
};
  /**
   * Removes a question from examBody at the given location.
   * Returns true if removed, false otherwise.
   */
  export const removeQuestionHelper = (examBody, location2) => {
    const { examBodyIndex, sectionIndex } = location2;
    const container = examBody?.[examBodyIndex];
  
    if (!container) return false;
  
    if (sectionIndex !== undefined && container.type === 'section') {
      container.questions?.splice(sectionIndex, 1);
      return true;
    }
  
    if (container.type === 'question') {
      examBody.splice(examBodyIndex, 1);
      return true;
    }
  
    return false;
  };
  
  /**
   * Renumbers all questions sequentially in the entire examBody.
   * Mutates examBody in place.
   */
  export const renumberQuestions = (examBody) => {
    let questionNumber = 1;
  
    examBody.forEach(item => {
      if (item.type === 'question') {
        item.questionNumber = questionNumber++;
      } else if (item.type === 'section' && Array.isArray(item.questions)) {
        item.questions.forEach(q => {
          if (q.type === 'question') {
            q.questionNumber = questionNumber++;
          }
        });
      }
    });
  };

  export const renumberSections = (examBody) => {
    let sectionNumber = 1;
  
    examBody.forEach(item => {
      if (item.type === 'section') {
        item.sectionNumber = sectionNumber++;
      }
  });
};
  
export const normaliseAnswersToLength = (answers, optionCount) => {
  const trimmed = answers.slice(0, optionCount);
  const padded = [...trimmed];

  while (padded.length < optionCount) {
    padded.push(createAnswer());
  }

  return padded;
};

export const normaliseAnswersPerTeleformOptions = (examData) => {
  const optionCount = examData.teleformOptions.length;
  const processQuestion = (question) => {
    if (!question.answers || !Array.isArray(question.answers)) return;
    question.answers = normaliseAnswersToLength(question.answers, optionCount);
  };

  examData.examBody.forEach(item => {
    if (item.type === 'section') {
      item.questions.forEach(processQuestion);
    } else if (item.type === 'question') {
      processQuestion(item);
    }
  });
};