import { latexToHtml } from './utils/latexToHtml.js';

/**
 * Transform the parsed LaTeX structure into the application's DTO format
 * @param {Object} parsedStructure - The parsed LaTeX structure
 * @returns {Object} - The transformed DTO ready to be used by the application
 */
export function transformLatexToDto(parsedStructure) {
  
  // Create a base exam object with enhanced metadata
  const dto = {
    type: 'exam',
    examBody: []
  };

  // Only add metadata fields that have actual values
  if (parsedStructure.metadata.examTitle?.trim()) dto.examTitle = parsedStructure.metadata.examTitle;
  if (parsedStructure.metadata.courseCode?.trim()) dto.courseCode = parsedStructure.metadata.courseCode;
  if (parsedStructure.metadata.courseName?.trim()) dto.courseName = parsedStructure.metadata.courseName;
  if (parsedStructure.metadata.semester?.trim()) dto.semester = parsedStructure.metadata.semester;
  if (parsedStructure.metadata.year?.trim()) dto.year = parsedStructure.metadata.year;

  // Generate cover page from metadata
  //dto.coverPage = createCoverPage(parsedStructure.metadata);
  
  // Process questions and sections
  dto.examBody = transformQuestionsAndSections(parsedStructure.questions);
  
  // Add any custom metadata from the LaTeX preamble
  // if (parsedStructure.preamble) {
  //   const extractedMetadata = extractMetadataFromPreamble(parsedStructure.preamble);
  //   if (extractedMetadata.length > 0) {
  //     dto.metadata = extractedMetadata;
  //   }
  // }
  
  return dto;
}

// /**
//  * Create a cover page component from metadata
//  * @param {Object} metadata - The metadata from the parsed LaTeX
//  * @returns {Object} - A cover page component
//  */
// function createCoverPage(metadata) {
//   const timeAllowed = metadata.timeAllowed || 'TWO hours';
  
//   const html = `<center>
//     <p><strong style='font-size: 20px;'>${metadata.institution || 'INSTITUTION'}</strong></p>
//     <p><strong style='font-size: 12px;'>${metadata.semester} SEMESTER ${metadata.year}</strong></p>
//     <p><strong style='font-size: 12px;'>Campus: ${metadata.campus || 'City'}</strong></p>
//     <p><strong style='font-size: 12px;'>${metadata.courseName}</strong></p>
//     <p><strong style='font-size: 12px;'>${metadata.examTitle}</strong></p>
//     <p><strong style='font-size: 12px;'>(Time Allowed: ${timeAllowed})</strong></p>
//   </center>`;
  
//   return {
//     type: 'content',
//     contentFormatted: html,
//     format: 'HTML',
//   };
// }

// /**
//  * Extract metadata from LaTeX preamble
//  * @param {string} preamble - The LaTeX preamble
//  * @returns {Array} - Array of metadata objects {key, value}
//  */
// function extractMetadataFromPreamble(preamble) {
//   const metadata = [];
  
//   // Extract \newcommand definitions as potential metadata
//   const commandRegex = /\\newcommand{\\([^}]+)}{([^}]*)}/g;
//   let match;
  
//   while ((match = commandRegex.exec(preamble)) !== null) {
//     metadata.push({
//       key: match[1],
//       value: match[2]
//     });
//   }
  
//   // Look for common metadata in comments
//   const commentRegex = /%\s*([^:]+):\s*(.+)$/gm;
//   while ((match = commentRegex.exec(preamble)) !== null) {
//     metadata.push({
//       key: match[1].trim(),
//       value: match[2].trim()
//     });
//   }
  
//   return metadata;
// }

/**
 * Transform questions and sections from the parsed structure to DTO format
 * @param {Array} items - The parsed questions and sections
 * @returns {Array} - Transformed questions and sections for the DTO
 */
function transformQuestionsAndSections(items) {
  const examBody = [];
  let questionNumber = 1;
  
  items.forEach(item => {
    if (item.type === 'section') {
      // Transform section
      const sectionNumber = examBody.length + 1;
      const sectionId = `s${sectionNumber}`;
      // const sectionTitle = item.title || `Section ${sectionNumber}`;
      
      const section = {
        type: 'section',
        contentFormatted: latexToHtml(item.content),
        format: 'HTML',
        // sectionTitle: sectionTitle,
        id: sectionId,
        questions: []
      };
      
      // Transform questions within the section
      item.questions.forEach(question => {
        const transformedQuestion = transformQuestion(question, questionNumber, sectionId);
        section.questions.push(transformedQuestion);
        questionNumber++;
      });
      
      examBody.push(section);
    } else {
      // Transform standalone question
      const transformedQuestion = transformQuestion(item, questionNumber);
      examBody.push(transformedQuestion);
      questionNumber++;
    }
  });
  
  return examBody;
}

/**
 * Transform a single question from parsed format to DTO format
 * @param {Object} question - The parsed question
 * @param {Number} questionNumber - The sequential question number
 * @param {String} sectionId - Optional parent section ID
 * @returns {Object} - Transformed question for the DTO
 */
function transformQuestion(question, questionNumber, sectionId = null) {
  const questionId = `q${questionNumber}`;
  
  // Format the question content as HTML
  const contentFormatted = latexToHtml(question.content);
  
  // Transform answers
  const answers = question.answers.map((answer, index) => transformAnswer(answer, questionId, index));
  
  // Ensure at least one correct answer
  const hasCorrectAnswer = answers.some(a => a.correct);
  if (answers.length > 0 && !hasCorrectAnswer) {
    // If no correct answer is marked, make the first one correct by default
    answers[0].correct = true;
  }
  
  // Fill with empty answers to match teleformOptions length (5 options)
  while (answers.length < 5) {
    answers.push({
      type: 'answer',
      contentFormatted: '',
      format: 'HTML',
      correct: false,
      id: `${questionId}a${answers.length + 1}`
    });
  }
  
  // Create the question object
  const result = {
    type: 'question',
    contentFormatted,
    format: 'HTML',
    marks: question.marks || 1,
    questionNumber,
    id: questionId,
    answers
  };
  
  // Add parent section reference if applicable
  if (sectionId) {
    result.sectionId = sectionId;
  }
  
  return result;
}

/**
 * Transform a single answer from parsed format to DTO format
 * @param {Object} answer - The parsed answer
 * @param {String} questionId - The parent question ID
 * @param {Number} index - The answer index
 * @returns {Object} - Transformed answer for the DTO
 */
function transformAnswer(answer, questionId, index) {
  // Format the answer content as HTML
  const contentFormatted = latexToHtml(answer.content);
  
  return {
    type: 'answer',
    contentFormatted,
    format: 'HTML',
    correct: answer.correct || false,
    id: `${questionId}a${index + 1}`
  };
}

// /**
//  * Simple function to strip LaTeX commands for plain text representation
//  * @param {String} latex - LaTeX content
//  * @returns {String} - Plain text representation
//  */
// function stripLatex(latex) {
//   if (!latex) return '';
  
//   // Remove LaTeX commands and environments
//   return latex
//     .replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/g, '') // Remove environment markers
//     .replace(/\\label\{[^}]*\}/g, '') // Remove labels
//     .replace(/\\ref\{[^}]*\}/g, '') // Remove references
//     .replace(/\\cite\{[^}]*\}/g, '') // Remove citations
//     .replace(/\\\w+(\[.*?\])?(\{.*?\})?/g, '$2') // Replace commands with their content
//     .replace(/\$\$(.*?)\$\$|\$(.*?)\$/g, '$1$2') // Extract math content
//     .replace(/\{|\}/g, '') // Remove braces
//     .replace(/\\['"]/g, '') // Remove escaped quotes
//     .replace(/\\%/g, '%') // Replace escaped percent
//     .replace(/\\\\/g, ' ') // Replace double backslash with space
//     .replace(/\s+/g, ' ') // Normalize whitespace
//     .trim();
// } 