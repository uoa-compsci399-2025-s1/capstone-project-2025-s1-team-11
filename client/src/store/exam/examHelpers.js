// examHelpers.js

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
      console.log(sectionNumber, item.sectionNumber);
      if (item.type === 'section') {
        item.sectionNumber = sectionNumber++;
      }
  });
};
  