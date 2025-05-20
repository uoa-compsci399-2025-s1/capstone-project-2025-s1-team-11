/**
 * Main function to parse LaTeX content into a structured object
 * @param {string} content - The raw LaTeX file content
 * @returns {Object} - A structured representation of the LaTeX document
 */
export function parseLatexToStructure(content) {
  // Extract document class and preamble
  const { documentClass, preamble, body } = extractDocumentStructure(content);
  
  // Parse the document body
  const parsedBody = parseBody(body, content);
  
  // Return structured data
  return {
    documentClass,
    preamble,
    ...parsedBody
  };
}

/**
 * Extract the main document structure: class, preamble, and body
 * @param {string} content - The raw LaTeX file content
 * @returns {Object} - The extracted document parts
 */
function extractDocumentStructure(content) {
  // Extract document class
  const documentClassMatch = content.match(/\\documentclass(?:\[([^\]]*)\])?\{([^}]*)\}/);
  const documentClass = documentClassMatch ? {
    name: documentClassMatch[2],
    options: documentClassMatch[1] ? documentClassMatch[1].split(',').map(opt => opt.trim()) : []
  } : { name: 'unknown', options: [] };
  
  // Find the beginning of the document environment
  const documentStart = content.indexOf('\\begin{document}');
  const documentEnd = content.lastIndexOf('\\end{document}');
  
  if (documentStart === -1 || documentEnd === -1) {
    throw new Error('Invalid LaTeX document: missing document environment');
  }
  
  // Extract preamble (everything before \begin{document})
  const preamble = content.substring(0, documentStart).trim();
  
  // Extract document body
  const body = content.substring(documentStart + 16, documentEnd).trim();
  
  return { documentClass, preamble, body };
}

/**
 * Parse the document body to extract exam components
 * @param {string} body - The LaTeX document body
 * @param {string} content - The raw LaTeX file content
 * @returns {Object} - The parsed body content including metadata, questions, and sections
 */
function parseBody(body, content) {
  // Extract document metadata
  const metadata = extractMetadata(body, content);
  
  // Parse questions
  const questions = parseQuestions(body);
  
  return {
    metadata,
    questions
  };
}

/**
 * Extract document metadata such as title, course code, etc.
 * @param {string} body - The LaTeX document body
 * @param {string} content - The raw LaTeX file content
 * @returns {Object} - Extracted metadata
 */
function extractMetadata(body, content) {
  // Find the content before the questions start
  const questionsStartIndex = body.indexOf('\\begin{questions}');
  const headerContent = questionsStartIndex !== -1 ? 
                        body.substring(0, questionsStartIndex).trim() : 
                        body;
  
  // Extract title
  let examTitle = '';
  
  // Look for common title patterns in the header
  const titlePatterns = [
    // Match title in \textbf{\fontsize{X}{Y}\selectfont TITLE} format
    /\\textbf\{\\fontsize\{[^}]*\}\{[^}]*\}\\selectfont\s+([^}]+)\}/,
    // Match title in a center environment with textbf
    /\\begin\{center\}[\s\S]*?\\textbf\{\\fontsize\{[^}]*\}\{[^}]*\}\\selectfont\s+([^}]+)\}[\s\S]*?\\end\{center\}/,
    // Match title in a center environment with subsection
    /\\begin\{center\}[\s\S]*?\\(?:sub)?section\*?\{([^}]+)\}[\s\S]*?\\end\{center\}/,
    // Match title after "Mathematics for Computer Science" pattern
    /Mathematics\s+for\s+Computer\s+Science/i,
    // Standard textbf pattern
    /\\textbf\{([^}]+)\}/
  ];
  
  for (const pattern of titlePatterns) {
    const match = headerContent.match(pattern);
    if (match && match[1]) {
      examTitle = match[1].trim();
      break;
    } else if (match) {
      // For patterns without capture groups (like the "Mathematics for" pattern)
      examTitle = match[0].trim();
      break;
    }
  }
  
  // If no title was found using patterns, look for the most likely title in the header
  if (!examTitle) {
    // Look for lines with larger font indications
    const lines = headerContent.split('\n');
    for (const line of lines) {
      if (line.includes('\\fontsize') || line.includes('\\large') || line.includes('\\LARGE')) {
        const cleaned = line
          .replace(/\\textbf\{|\}/g, '')
          .replace(/\\fontsize\{[^}]*\}\{[^}]*\}/g, '')
          .replace(/\\(?:LARGE|Large|large)/g, '')
          .trim();
        
        if (cleaned.length > 5) { // Likely a title if it's reasonably long
          examTitle = cleaned;
          break;
        }
      }
    }
    
    // If still not found, look for centered content that might be a title
    if (!examTitle) {
      const centerMatch = headerContent.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
      if (centerMatch) {
        const centerContent = centerMatch[1];
        const centerLines = centerContent.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 10); // Filter out short lines
        
        // Take the most likely title line - often a longer one in the middle
        if (centerLines.length > 2) {
          // Skip first line (usually university name) and look for longer lines
          for (let i = 1; i < centerLines.length; i++) {
            const line = centerLines[i]
              .replace(/\\textbf\{|\}/g, '')
              .replace(/\\fontsize\{[^}]*\}\{[^}]*\}/g, '')
              .trim();
            
            if (line.length > 10 && !line.match(/^\d/)) { // Not likely to start with a number
              examTitle = line;
              break;
            }
          }
        }
      }
    }
  }
  
  // Default title if we couldn't extract one
  if (!examTitle || examTitle.includes('\\fontsize')) {
    examTitle = 'Exam';
  }
  
  // Extract course code - first check the header which is more reliable
  let courseCode = '';
  
  // First check for header definitions like \firstpageheader{}{}{COMPSCI 120}
  // We need to look in the whole document content, not just the body
  const preambleMatch = content.match(/\\(?:firstpage|running)header\s*\{\s*\}\s*\{\s*\}\s*\{\s*([^}]+)\s*\}/);
  if (preambleMatch && preambleMatch[1] && preambleMatch[1].match(/([A-Z]+)\s+(\d+)/)) {
    courseCode = preambleMatch[1].trim();
    //console.log("Found course code in document header:", courseCode);
  } else {
    // Fall back to looking in the document body
    const courseCodeMatches = headerContent.match(/([A-Z]+)\s+(\d+)/g);
    if (courseCodeMatches) {
      // Filter out semester matches (which could be confused with course codes)
      const filteredMatches = courseCodeMatches.filter(match => 
        !match.includes('SEMESTER') && 
        !match.includes('SUMMER') && 
        !match.includes('SPRING') && 
        !match.includes('AUTUMN') && 
        !match.includes('WINTER') && 
        !match.includes('FALL')
      );
      courseCode = filteredMatches.length > 0 ? filteredMatches[0].trim() : '';
      //console.log("Found course code in document body:", courseCode);
    }
  }
  
  // Extract semester and year
  const semesterPattern = /(SUMMER|SPRING|AUTUMN|WINTER|FALL|SEMESTER)\s+(SEMESTER)?\s*(\d{4})/i;
  const semesterMatch = headerContent.match(semesterPattern);
  
  const semester = semesterMatch ? semesterMatch[1].toUpperCase() : '';
  const year = semesterMatch ? semesterMatch[3] : new Date().getFullYear().toString();
  
  // Extract campus
  let campus = '';
  if (headerContent.includes('Campus: City')) {
    campus = 'City';
  } else if (headerContent.includes('Campus:')) {
    const campusMatch = headerContent.match(/Campus:\s*([A-Za-z]+)/);
    if (campusMatch) campus = campusMatch[1];
  }
  
  // Extract time allowed
  let timeAllowed = '';
  const timeAllowedMatch = headerContent.match(/Time\s+Allowed:\s+([^)]+)/i);
  if (timeAllowedMatch) {
    timeAllowed = timeAllowedMatch[1].trim();
  } else {
    // Look for patterns like (THREE hours)
    const hoursMatch = headerContent.match(/\(([A-Za-z]+\s+hours?)\)/i);
    if (hoursMatch) {
      timeAllowed = hoursMatch[1];
    } else {
      timeAllowed = '';
    }
  }
  
  // Check for test/exam indicators
  const isTest = headerContent.toLowerCase().includes('test') || 
                 headerContent.toLowerCase().includes('quiz');
  
  // Try to extract institution name
  let institution = '';
  const institutionMatch = headerContent.match(/([A-Z\s]+UNIVERSITY|[A-Z\s]+COLLEGE)/i);
  if (institutionMatch) {
    institution = institutionMatch[0].trim();
  }
  
  return {
    institution,
    courseCode,
    courseName: '', // No default course name assumption
    examTitle,
    semester,
    year,
    campus,
    timeAllowed,
    isTest
  };
}

/**
 * Parse all questions and sections from the document
 * @param {string} body - The LaTeX document body
 * @returns {Array} - Array of parsed questions and sections
 */
function parseQuestions(body) {
  //console.log("Starting to parse questions from LaTeX body");
  
  // Find the questions environment
  const questionsMatch = body.match(/\\begin{questions}([\s\S]*?)\\end{questions}/);
  if (!questionsMatch) {
    console.warn("No questions environment found in LaTeX document");
    return [];
  }
  
  const questionsContent = questionsMatch[1];
  //console.log("Found questions content with length:", questionsContent.length);
  
  // Split content into individual questions and sections
  const questions = [];
  
  // More specific regex patterns to better match LaTeX exam class format
  // This pattern matches \question commands with optional marks
  const questionRegex = /\\question(?:\[([^\]]+)\])?([\s\S]*?)(?=\\question|\\end{questions}|$)/g;
  
  // Extract all questions first
  let allQuestions = [];
  let questionMatch;
  
  while ((questionMatch = questionRegex.exec(questionsContent)) !== null) {
    const marks = questionMatch[1] ? parseInt(questionMatch[1], 10) : 1;
    const content = questionMatch[2].trim();
    
    allQuestions.push({
      marks,
      content
    });
  }
  
  //console.log(`Found ${allQuestions.length} questions in the document`);
  
  // Process each question
  allQuestions.forEach((item, index) => {
    // Check if this question contains parts (making it a section)
    const partsMatch = item.content.match(/\\begin{parts}([\s\S]*?)\\end{parts}/);
    
    if (partsMatch) {
      console.log(`Question ${index + 1} contains parts - treating as section`);
      
      // Remove choices environment from content to prevent duplication
      let sectionContent = item.content;
      
      // Remove choices environments
      const choicesMatch = sectionContent.match(/\\begin\{(?:choices|oneparchoices)\}([\s\S]*?)\\end\{(?:choices|oneparchoices)\}/);
      if (choicesMatch) {
        sectionContent = sectionContent.replace(choicesMatch[0], '');
      }
      
      // Remove solution environments
      const solutionMatch = sectionContent.match(/\\begin\{solution\}([\s\S]*?)\\end\{solution\}/);
      if (solutionMatch) {
        sectionContent = sectionContent.replace(solutionMatch[0], '');
      }
      
      // Create a section object
      const section = {
        type: 'section',
        content: sectionContent.replace(/\\begin{parts}[\s\S]*?\\end{parts}/, '').trim(),
        marks: item.marks,
        questions: []
      };
      
      // Extract parts (sub-questions)
      const partsContent = partsMatch[1];
      const partRegex = /\\part(?:\[([^\]]+)\])?([\s\S]*?)(?=\\part|\\end{parts}|$)/g;
      
      let partMatch;
      while ((partMatch = partRegex.exec(partsContent)) !== null) {
        const partMarks = partMatch[1] ? parseInt(partMatch[1], 10) : 1;
        const partContent = partMatch[2].trim();
        
        //console.log(`  - Found part with ${partMarks} marks`);
        
        // Clean part content by removing choices and solution environments
        let cleanedPartContent = partContent;
        
        // Remove choices environments
        const partChoicesMatch = partContent.match(/\\begin\{(?:choices|oneparchoices)\}([\s\S]*?)\\end\{(?:choices|oneparchoices)\}/);
        if (partChoicesMatch) {
          cleanedPartContent = cleanedPartContent.replace(partChoicesMatch[0], '');
        }
        
        // Remove solution environments and Exp blocks
        const partSolutionMatch = cleanedPartContent.match(/\\begin\{solution\}([\s\S]*?)\\end\{solution\}/);
        if (partSolutionMatch) {
          cleanedPartContent = cleanedPartContent.replace(partSolutionMatch[0], '');
        }
        
        // Remove Exp blocks (explanations)
        cleanedPartContent = cleanedPartContent.replace(/\\Exp\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
        
        // Create a question from this part
        section.questions.push({
          type: 'question',
          content: cleanedPartContent,
          marks: partMarks,
          answers: extractAnswers(partContent)
        });
      }
      
      questions.push(section);
    } else {
      // Regular standalone question
      //console.log(`Question ${index + 1} is a standalone question with ${item.marks} marks`);
      
      // Clean question content by removing choices and solution environments
      let cleanedContent = item.content;
      
      // Remove choices environments
      const choicesMatch = item.content.match(/\\begin\{(?:choices|oneparchoices)\}([\s\S]*?)\\end\{(?:choices|oneparchoices)\}/);
      if (choicesMatch) {
        cleanedContent = cleanedContent.replace(choicesMatch[0], '');
      }
      
      // Remove solution environments
      const solutionMatch = cleanedContent.match(/\\begin\{solution\}([\s\S]*?)\\end\{solution\}/);
      if (solutionMatch) {
        cleanedContent = cleanedContent.replace(solutionMatch[0], '');
      }
      
      // Remove Exp blocks (explanations)
      cleanedContent = cleanedContent.replace(/\\Exp\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
      
      // Remove MC blocks (marking criteria)
      cleanedContent = cleanedContent.replace(/\\MC\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
      
      questions.push({
        type: 'question',
        content: cleanedContent,
        marks: item.marks,
        answers: extractAnswers(item.content)
      });
    }
  });
  
  //console.log(`Processed ${questions.length} total items (questions + sections)`);
  return questions;
}

/**
 * Extract multiple-choice answers from question content
 * @param {string} questionContent - The question content text
 * @returns {Array} - Array of answer objects
 */
function extractAnswers(questionContent) {
  const answers = [];
  
  // Find choices environments (supports both choices and oneparchoices)
  const choicesMatch = questionContent.match(/\\begin\{(?:choices|oneparchoices)\}([\s\S]*?)\\end\{(?:choices|oneparchoices)\}/);
  if (!choicesMatch) {
    //console.log("No choices environment found in question");
    return answers;
  }
  
  const choicesContent = choicesMatch[1];
  //console.log("Found choices content with length:", choicesContent.length);

  // Special handling for certain patterns with math in them
  // First, try to extract choices with \mycorrectchoice and \choice commands 
  // treating the entire LaTeX command patterns carefully
  let extractedChoices = [];
  
  // Find \mycorrectchoice{ content }, being careful with math inside
  const mycorrectPattern = /\\mycorrectchoice\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let mycorrectMatch;
  while ((mycorrectMatch = mycorrectPattern.exec(choicesContent)) !== null) {
    if (mycorrectMatch[1] && mycorrectMatch[1].trim()) {
      extractedChoices.push({
        content: mycorrectMatch[1].trim(),
        correct: true
      });
    }
  }
  
  // Find \choice content lines, being careful to handle math correctly
  const choiceLines = choicesContent.split('\n');
  for (let i = 0; i < choiceLines.length; i++) {
    const line = choiceLines[i].trim();
    
    if (line.startsWith('\\choice') && !line.startsWith('\\mycorrectchoice')) {
      // Extract content after \choice command
      let content = line.replace(/^\\choice\s*/, '').trim();
      
      // Collect lines until the next choice or end
      let j = i + 1;
      while (j < choiceLines.length && 
             !choiceLines[j].trim().startsWith('\\choice') && 
             !choiceLines[j].trim().startsWith('\\mycorrectchoice')) {
        content += ' ' + choiceLines[j].trim();
        j++;
      }
      
      if (content) {
        extractedChoices.push({
          content: content.trim(),
          correct: false
        });
      }
    }
  }
  
  // If we found choices, use them
  if (extractedChoices.length > 0) {
    return extractedChoices;
  }
  
  // If nothing was found, fall back to the previous methods with patterns
  const choicePatterns = [
    { regex: /\\mycorrectchoice\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, isCorrect: true },
    { regex: /\\choice\s+([^\\]+?)(?=\\(?:choice|mycorrectchoice)|$)/g, isCorrect: false }
  ];

  // Apply each pattern to extract choices
  for (const pattern of choicePatterns) {
    let match;
    pattern.regex.lastIndex = 0; // Reset regex state
    
    while ((match = pattern.regex.exec(choicesContent)) !== null) {
      if (match[1] && match[1].trim()) {
        answers.push({
          content: match[1].trim(),
          correct: pattern.isCorrect
        });
        //console.log(`Found ${pattern.isCorrect ? 'correct' : 'regular'} choice: "${match[1].trim().substring(0, 20)}..."`);
      }
    }
  }
  
  // If the patterns above didn't find all choices, use a line-by-line approach
  if (answers.length < 2) {
    // Clear the answers array and try a different approach
    answers.length = 0;
    
    // Split by lines and look for choice commands at the beginning of lines
    const lines = choicesContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('\\mycorrectchoice')) {
        let content = '';
        
        // Handle braced content: \mycorrectchoice{content}
        const braceMatch = line.match(/\\mycorrectchoice\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/);
        if (braceMatch) {
          content = braceMatch[1].trim();
        } else {
          // Handle inline content: \mycorrectchoice content
          content = line.replace(/^\\mycorrectchoice\s*/, '').trim();
          
          // If the content continues on next lines, collect until the next choice or end
          let j = i + 1;
          while (j < lines.length && 
                !lines[j].trim().startsWith('\\choice') && 
                !lines[j].trim().startsWith('\\mycorrectchoice')) {
            content += ' ' + lines[j].trim();
            j++;
          }
        }
        
        if (content) {
          answers.push({
            content,
            correct: true
          });
          //console.log(`Found correct choice: "${content.substring(0, 20)}..."`);
        }
      } else if (line.startsWith('\\choice')) {
        let content = line.replace(/^\\choice\s*/, '').trim();
        
        // If the content continues on next lines, collect until the next choice or end
        let j = i + 1;
        while (j < lines.length && 
              !lines[j].trim().startsWith('\\choice') && 
              !lines[j].trim().startsWith('\\mycorrectchoice')) {
          content += ' ' + lines[j].trim();
          j++;
        }
        
        if (content) {
          answers.push({
            content,
            correct: false
          });
          //console.log(`Found regular choice: "${content.substring(0, 20)}..."`);
        }
      }
    }
  }
  
  // Use the extracted choices if we found them, otherwise use answers
  return extractedChoices.length > 0 ? extractedChoices : answers;
} 