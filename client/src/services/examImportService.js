//import { parseExamDocx } from '../dto/DOCX_Exam_DTO';

import { parseDocx } from '../dto/docx/docxParser.js';
import { MoodleXmlDTO } from '../dto/moodleXML/moodleXmlDTO.js'
import { normaliseDocxDTO, normaliseMoodleDTO } from './normalisers.js'; // Helper functions for normalization
import { convertMoodleXmlToJson } from '../utilities/convertMoodleXmlToJson.js';

// This service handles the import of exams from various formats
export class ExamImportService {
  constructor() {
    this.importFormats = {
      'docx': this.processDocxExam.bind(this),
      'moodle': this.processMoodleExam.bind(this),
    };
  }

  async importExam(file, format) {
    if (!this.importFormats[format]) {
      throw new Error(`Unsupported exam format: ${format}`);
    }

    // process import file to get normalised DTO;
    return await this.importFormats[format](file);
  }

  async processDocxExam(file) {
    const docxDTO = await parseDocx(file);
    return normaliseDocxDTO(docxDTO);
  }

  async processMoodleExam(file) {
    // Assuming Moodle XML is parsed from the content
    const content = await this.readFileContent(file);

    const moodleDTO = new MoodleXmlDTO(content);
    const DtoObject = convertMoodleXmlToJson(moodleDTO);
    return normaliseMoodleDTO(DtoObject);
  }


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

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }


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