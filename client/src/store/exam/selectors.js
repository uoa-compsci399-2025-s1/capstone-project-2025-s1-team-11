// selectors.js

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
export const selectAllQuestionsFlat = (state) => {
  const body = selectExamBody(state);
  if (!body) return [];

  return body.flatMap((item) => {
    if (item.type === 'question') return [item];
    if (item.type === 'section') return item.questions || [];
    return [];
  });
};

export const selectTotalMarks = (state) => {
  const questions = selectAllQuestionsFlat(state);
  return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
};

export const selectQuestionsForTable = (state) => {
  const examBody = selectExamBody(state);
  if (!examBody) return [];

  const result = [];

  examBody.forEach((item) => {
    if (item.type === 'question') {
      result.push(normaliseQuestionForTable(item, null));
    } else if (item.type === 'section') {
      item.questions?.forEach((q, i) => {
        result.push(normaliseQuestionForTable(q, item.sectionNo, i));
      });
    }
  });

  return result;
};

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