/**
 * LaTeX parser for exam files
 * This module serves as the main entry point for parsing LaTeX files into the application's data format
 */

import { parseLatexToStructure } from './utils/parseLatexToStructure.js';
import { transformLatexToDto } from './transformLatexToDto.js';

/**
 * Parse a LaTeX file and convert it to the application's data format
 * @param {string} content - The raw content of the LaTeX file
 * @param {object} options - Optional parser configuration
 * @returns {object} - The parsed exam data in DTO format
 */
export function parseLatex(content, options = {}) {
  try {
    console.log("Starting LaTeX parsing process");
    
    // Ensure content is a string
    if (content === null || content === undefined) {
      throw new Error("Content is null or undefined");
    }
    
    // If content is a File object, it needs to be read first
    if (typeof content !== 'string') {
      if (content instanceof File) {
        throw new Error("Content is a File object. Please read the file content first.");
      } else {
        throw new Error(`Expected string content but got ${typeof content}`);
      }
    }
    
    // Step 1: Parse LaTeX into structured object
    const parsedStructure = parseLatexToStructure(content);
    
    // For debugging: optionally save intermediate structure
    if (options.debug) {
      console.log("Parsed LaTeX structure:", JSON.stringify(parsedStructure, null, 2));
    }
    
    // Step 2: Transform the parsed structure into the application's DTO format
    const dto = transformLatexToDto(parsedStructure);
    
    // For debugging: optionally save final DTO
    if (options.debug) {
      console.log("Final DTO:", JSON.stringify(dto, null, 2));
    }
    
    console.log("LaTeX parsing completed successfully");
    return dto;
  } catch (error) {
    console.error("Error parsing LaTeX:", error);
    throw new Error(`Failed to parse LaTeX content: ${error.message}`);
  }
}

/**
 * Save parsed LaTeX data for debugging
 * @param {Object} data - The data to save
 * @param {String} filename - The filename to save to
 */
export function saveDebugData(data, filename) {
  // This is a placeholder for actual implementation
  // In a browser environment, this could trigger a download
  // In Node.js, this could write to a file
  console.log(`Debug data would be saved to ${filename}`);
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Identify if a file is likely to be a LaTeX file
 * @param {String} content - The file content to check
 * @returns {Boolean} - True if the content appears to be LaTeX
 */
export function isLikelyLatex(content) {
  // Check for common LaTeX document elements
  const hasDocumentClass = content.includes('\\documentclass');
  const hasBeginDocument = content.includes('\\begin{document}');
  const hasEndDocument = content.includes('\\end{document}');
  
  // Either has document class or both begin/end document markers
  return hasDocumentClass || (hasBeginDocument && hasEndDocument);
}

/**
 * Get information about the parsed LaTeX document
 * @param {String} content - The LaTeX content
 * @returns {Object} - Basic information about the document
 */
export function getLatexInfo(content) {
  try {
    // Extract document class
    const documentClassMatch = content.match(/\\documentclass(?:\[([^\]]*)\])?\{([^}]*)\}/);
    const documentClass = documentClassMatch ? {
      name: documentClassMatch[2],
      options: documentClassMatch[1] ? documentClassMatch[1].split(',').map(opt => opt.trim()) : []
    } : { name: 'unknown', options: [] };
    
    // Check if it's an exam document
    const isExam = documentClass.name === 'exam';
    
    // Check for questions environment
    const hasQuestions = content.includes('\\begin{questions}');
    
    // Estimate number of questions by counting \question commands
    const questionMatches = content.match(/\\question/g);
    const estimatedQuestions = questionMatches ? questionMatches.length : 0;
    
    return {
      documentClass: documentClass.name,
      documentOptions: documentClass.options,
      isExam,
      hasQuestions,
      estimatedQuestions
    };
  } catch (error) {
    console.error("Error getting LaTeX info:", error);
    return {
      documentClass: 'unknown',
      documentOptions: [],
      isExam: false,
      hasQuestions: false,
      estimatedQuestions: 0,
      error: error.message
    };
  }
} 