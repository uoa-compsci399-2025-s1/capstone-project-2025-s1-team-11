import { parseExamDocx } from '../dto/DOCX_Exam_DTO';

// This service handles the import of exams from various formats
class ExamImportService {
  constructor() {
    this.supportedFormats = {
      'docx': this.processDocxExam,
      'xml': this.processXmlExam, // Placeholder for future implementation
    };
  }

  /**
   * Import an exam from a file
   * @param {File} file - The exam file to import
   * @param {string} format - The format of the file (docx, xml, etc.)
   * @returns {Promise<Object>} - The normalized exam object ready for Redux
   */
  async importExam(file, format) {
    if (!this.supportedFormats[format]) {
      throw new Error(`Unsupported exam format: ${format}`);
    }

    // Convert the file to appropriate content based on format
    const content = await this.fileToContent(file, format);
    
    // Process the content using the appropriate handler
    const examDTO = await this.supportedFormats[format](content);
    
    // Normalize the DTO for Redux store
    return this.normalizeForRedux(examDTO);
  }

  /**
   * Convert a file to the content needed for processing
   * @param {File} file - The exam file
   * @param {string} format - The format of the file
   * @returns {Promise<string|Document>} - The content needed for processing
   */
  async fileToContent(file, format) {
    if (format === 'docx') {
      // For DOCX files, we need to convert to HTML first
      // This is just a placeholder - you'll need to use a library like mammoth.js
      // return await this.convertDocxToHtml(file);
      
      // For demonstration, let's assume we already have the HTML content
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.readAsText(file);
      });
    } else if (format === 'xml') {
      // For XML files, we can just get the text content
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.readAsText(file);
      });
    }
    
    throw new Error(`Unsupported format for content conversion: ${format}`);
  }

  /**
   * Process a DOCX exam file that has been converted to HTML
   * @param {string} htmlContent - The HTML content from the DOCX file
   * @returns {Object} - The exam DTO
   */
  async processDocxExam(htmlContent) {
    return parseExamDocx(htmlContent);
  }

  /**
   * Process an XML exam file (placeholder for future implementation)
   * @param {string} xmlContent - The XML content
   * @returns {Object} - The exam DTO
   */
  async processXmlExam(xmlContent) {
    // This is a placeholder for future implementation
    // You would parse the XML and convert it to the exam DTO format
    throw new Error('XML exam import not yet implemented');
  }

  /**
   * Normalize the exam DTO for Redux
   * @param {Object} examDTO - The exam DTO
   * @returns {Object} - The normalized exam object for Redux
   */
  normalizeForRedux(examDTO) {
    // This method would transform the DTO into whatever normalized format
    // your Redux store expects. For now, we'll return it as is.
    
    // You might want to add IDs to questions and answers, normalize nested entities, etc.
    return this.addIdsToExamEntities(examDTO);
  }

  /**
   * Add unique IDs to all entities in the exam
   * @param {Object} examDTO - The exam DTO
   * @returns {Object} - The exam with unique IDs added
   */
  addIdsToExamEntities(examDTO) {
    // Create a deep copy to avoid mutating the original
    const exam = JSON.parse(JSON.stringify(examDTO));
    
    // Add IDs to exam body items (questions and sections)
    exam.examBody = exam.examBody.map((item, index) => {
      const id = `${item.type}_${index}`;
      
      if (item.type === 'question') {
        return {
          ...item,
          id,
          answers: this.addIdsToAnswers(item.answers, id)
        };
      } else if (item.type === 'section') {
        return {
          ...item,
          id,
          questions: item.questions.map((question, qIndex) => {
            const questionId = `${id}_question_${qIndex}`;
            return {
              ...question,
              id: questionId,
              answers: this.addIdsToAnswers(question.answers, questionId)
            };
          })
        };
      }
      
      return { ...item, id };
    });
    
    return exam;
  }

  /**
   * Add unique IDs to answers
   * @param {Array} answers - The answer objects
   * @param {string} parentId - The parent question ID
   * @returns {Array} - The answers with unique IDs
   */
  addIdsToAnswers(answers, parentId) {
    return answers.map((answer, index) => ({
      ...answer,
      id: `${parentId}_answer_${index}`
    }));
  }
}

// Create and export a singleton instance
const examImportService = new ExamImportService();
export default examImportService;