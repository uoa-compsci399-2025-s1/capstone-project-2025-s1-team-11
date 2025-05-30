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
export const removeQuestionHelper = (examBody, location) => {
  const { examBodyIndex, questionsIndex } = location;
  const container = examBody?.[examBodyIndex];

  if (!container) return;

  if (container.type === "section" && typeof questionsIndex === "number") {
    container.questions?.splice(questionsIndex, 1);
  } else if (container.type === "question") {
    examBody.splice(examBodyIndex, 1);
  }
};
  /**
   * Removes a question from examBody at the given location.
   * Returns true if removed, false otherwise.
  
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
  }; */
  
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

/**
 * Creates a minimal exam structure from marking key data
 * @param {Object} markingKeyData - The marking key data containing versions, mappings, and weights
 * @returns {Object} A minimal exam structure suitable for marking
 */
export function createMinimalExamFromMarkingKey(markingKeyData, createExam, createQuestion, createAnswer, generateId) {
  const { versions, questionMappings, markWeights } = markingKeyData;

  // Find the maximum number of options from the option sequences
  let maxOptions = 0;
  Object.values(questionMappings).forEach(questionData => {
    Object.values(questionData).forEach(versionData => {
      maxOptions = Math.max(maxOptions, versionData.shuffleMap.length);
    });
  });

  // Create teleform options based on the number of options found
  const teleformOptions = Array.from({ length: maxOptions }, (_, i) => 
    String.fromCharCode(97 + i) // 97 is 'a' in ASCII
  );

  // Initialize minimal exam structure
  const examData = createExam({
    examTitle: 'Marking Only Exam',
    versions: versions,
    teleformOptions: teleformOptions,
    examBody: []
  });

  // Create questions based on marking key data
  Object.entries(questionMappings).forEach(([questionNumber, questionData]) => {
    const newQuestion = createQuestion({
      id: generateId(),
      questionNumber: parseInt(questionNumber),
      contentFormatted: `Question ${questionNumber}`,
      marks: markWeights[questionNumber] || 1,
      answers: Array.from({ length: maxOptions }, (_, i) => createAnswer({
        contentFormatted: `Option ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
        correct: false
      }))
    });

    // Initialize shuffle maps for all versions
    newQuestion.answerShuffleMaps = versions.map(versionId => {
      const mappingData = questionData[versionId];
      return mappingData ? mappingData.shuffleMap : [...Array(maxOptions).keys()];
    });

    // Set correct answers based on the first version's data
    const firstVersionData = questionData[versions[0]];
    if (firstVersionData) {
      firstVersionData.correctAnswerIndices.forEach(correctIndex => {
        // Find which original answer maps to this correct position
        for (let i = 0; i < firstVersionData.shuffleMap.length; i++) {
          if (firstVersionData.shuffleMap[i] === correctIndex) {
            newQuestion.answers[i].correct = true;
          }
        }
      });
    }

    examData.examBody.push(newQuestion);
  });

  return examData;
}