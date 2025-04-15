// this is a placeholder straight out of Claude
// not sure how/if this works
// need to transfer some of the methods from the old Class model to here

// Basic selector - gets the entire exam
export const selectExam = (state) => state.exam;

// More specific selectors
export const selectExamTitle = (state) => state.exam?.examTitle;
export const selectExamSections = (state) => 
  state.exam?.examBody.filter(comp => comp.type === 'Section') || [];

// Computed/derived data
// export const selectTotalPoints = (state) => {
//   if (!state.exam) return 0;
  
//   return state.exam.examBody
//     .filter(comp => comp.type === 'Section')
//     .flatMap(section => section.questions)
//     .reduce((sum, question) => sum + (question.points || 0), 0);
// };

// Find a specific question (replacing your getQuestion method)
export const selectQuestionByNumber = (state, questionNumber) => {
  if (!state.exam) return null;
  
  let currentCount = 0;
  
  for (const component of state.exam.examBody) {
    if (component.type === 'Section') {
      for (const question of component.questions) {
        currentCount++;
        if (currentCount === questionNumber) {
          return question;
        }
      }
    } else if (component.type === 'Question') {
      currentCount++;
      if (currentCount === questionNumber) {
        return component;
      }
    }
  }
  
  return null;
};