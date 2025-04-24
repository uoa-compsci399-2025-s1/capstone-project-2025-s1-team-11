// src/services/examImportService.js
// This is a Claude placeholder, doesn't necessarily match how our DTO's are 
// going to be structured.

import { createExam, createSection, createQuestion } from '../utils/examUtils';

/**
 * Master import service that orchestrates the import process
 */
export const importExamFromDTO = (examDTO) => {
  try {
    // Create the base exam object
    const exam = createBaseExamFromDTO(examDTO);
    
    // Add sections and questions
    if (examDTO.sections) {
      examDTO.sections.forEach(sectionDTO => {
        const section = createSectionFromDTO(sectionDTO);
        
        // Add questions to section if they exist
        if (sectionDTO.questions) {
          sectionDTO.questions.forEach(questionDTO => {
            const question = createQuestionFromDTO(questionDTO);
            section.questions.push(question);
          });
        }
        
        exam.examBody.push(section);
      });
    }
    
    // Add cover page if it exists
    if (examDTO.coverPage) {
      exam.coverPage = {
        type: 'ContentBlock',
        content: examDTO.coverPage.content || '',
        format: examDTO.coverPage.format || 'HTML',
        pageBreakAfter: true
      };
    }
    
    // Add appendix if it exists
    if (examDTO.appendix) {
      exam.appendix = {
        type: 'ContentBlock',
        content: examDTO.appendix.content || '',
        format: examDTO.appendix.format || 'HTML',
        pageBreakAfter: false
      };
    }
    
    return exam;
  } catch (error) {
    console.error('Error importing exam from DTO:', error);
    throw new Error(`Failed to import exam: ${error.message}`);
  }
};

/**
 * Creates the base exam object from DTO
 */
const createBaseExamFromDTO = (examDTO) => {
  return createExam(
    examDTO.examTitle || 'Untitled Exam',
    examDTO.courseCode || '',
    examDTO.courseName || '',
    examDTO.semester || '',
    examDTO.year || new Date().getFullYear()
  );
};

/**
 * Creates a section object from DTO
 */
const createSectionFromDTO = (sectionDTO) => {
  return createSection({
    content: sectionDTO.content || '',
    format: sectionDTO.format || 'HTML',
    sectionTitle: sectionDTO.sectionTitle || '',
    sectionNumber: sectionDTO.sectionNumber || null,
    questions: [] // Will add questions separately
  });
};

/**
 * Creates a question object from DTO
 */
const createQuestionFromDTO = (questionDTO) => {
  // Handle the case where answers might be in different formats
  let answers = ['', '', '', '', ''];
  let correctAnswers = [0, 0, 0, 0, 0];
  
  // Parse answers if they exist
  if (questionDTO.answers && Array.isArray(questionDTO.answers)) {
    // Make sure we don't exceed 5 answers
    const maxAnswers = Math.min(questionDTO.answers.length, 5);
    
    for (let i = 0; i < maxAnswers; i++) {
      const answer = questionDTO.answers[i];
      
      // Handle different possible structures for answers
      if (typeof answer === 'string') {
        answers[i] = answer;
      } else if (typeof answer === 'object') {
        answers[i] = answer.text || '';
        if (answer.isCorrect) {
          correctAnswers[i] = 1;
        }
      }
    }
  }
  
  // If no correct answer was marked, default to the first one
  if (correctAnswers.every(val => val === 0)) {
    correctAnswers[0] = 1;
  }
  
  // Create the question object
  return createQuestion({
    content: questionDTO.content || '',
    format: questionDTO.format || 'HTML',
    questionNumber: questionDTO.questionNumber || null,
    marks: questionDTO.marks || 1,
    answers: answers,
    correctAnswers: correctAnswers,
    lockedPositions: questionDTO.lockedPositions || [-1, -1, -1, -1, -1],
    answerShuffleMap: questionDTO.answerShuffleMap || [
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4]
    ]
  });
};