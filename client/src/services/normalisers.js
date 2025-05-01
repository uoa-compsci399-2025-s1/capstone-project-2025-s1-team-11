// // normalisers.js

// function normalizeSection(section) {
//     return {
//       type: 'section',
//       contentFormatted: section.contentFormatted || '',  // Fallback for missing content
//       format: section.format || 'HTML',  // Default format
//       pageBreakAfter: section.pageBreakAfter || false,  // Default for page break
//       questions: (section.questions || []).map(normalizeQuestion),  // Normalize nested questions
//     };
//   }

// function normalizeQuestion(question) {
// return {
//     type: 'question',
//     contentFormatted: question.contentFormatted || '',  // Fallback for missing content
//     format: question.format || 'HTML',
//     pageBreakAfter: question.pageBreakAfter || false,
//     marks: question.marks || 1,  // Default marks
//     answers: (question.answers || []).map(normalizeAnswer),  // Normalize nested answers
// };
// }

// function normalizeAnswer(answer) {
// return {
//     type: 'answer',
//     contentFormatted: answer.contentFormatted || '',  // Default empty content if missing
//     format: answer.format || 'HTML',  // Ensure HTML format
// };
// }

// function normalizeExamData(examData) {
// if (!examData) return null;

// return {
//     ...examData,
//     examBody: (examData.examBody || []).map((section) => normalizeSection(section)),
// };
// }

  
// export const normaliseDocxDTO = (DTO) => {
//     return DTO;
// }

// export const normaliseMoodleDTO = (DTO) => {
//     return DTO;
// }

// addIdsToExamEntities(examDTO) {
//     // Create a deep copy to avoid mutating the original
//     const exam = JSON.parse(JSON.stringify(examDTO));
    
//     // Add IDs to exam body items (questions and sections)
//     exam.examBody = exam.examBody.map((item, index) => {
//       const id = `${item.type}_${index}`;
      
//       if (item.type === 'question') {
//         return {
//           ...item,
//           id,
//           answers: this.addIdsToAnswers(item.answers, id)
//         };
//       } else if (item.type === 'section') {
//         return {
//           ...item,
//           id,
//           questions: item.questions.map((question, qIndex) => {
//             const questionId = `${id}_question_${qIndex}`;
//             return {
//               ...question,
//               id: questionId,
//               answers: this.addIdsToAnswers(question.answers, questionId)
//             };
//           })
//         };
//       }
      
//       return { ...item, id };
//     });
    
//     return exam;
//   }