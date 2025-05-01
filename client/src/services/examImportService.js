//import { parseExamDocx } from '../dto/DOCX_Exam_DTO';

import { parseDocx } from '../dto/docx/docxParser.js';
import { MoodleXmlDTO } from '../dto/moodleXML/moodleXmlDTO.js'
//import { normaliseDocxDTO, normaliseMoodleDTO } from './normalisers.js'; // Helper functions for normalization
//import { convertMoodleXmlToJson } from '../utilities/convertMoodleXmlToJson.js';
import { convertMoodleXmlDTOToJsonWithSections } from '../utilities/convertMoodleXmlToJsonWithSections.js';

// This service handles the import of exams from various formats
export class ExamImportService {
  constructor() {
    this.importFormats = {
      'docx': this.processDocxExam.bind(this),
      'moodle': this.processMoodleExam.bind(this),
    };
  }

  async importExamToDTO(file, format) {
    if (!this.importFormats[format]) {
      throw new Error(`Unsupported exam format: ${format}`);
    }

    // process import file to get normalised DTO;
    return await this.importFormats[format](file);
  }

  async processDocxExam(file) {
    const docxDTO = await parseDocx(file);
    //return normaliseDocxDTO(docxDTO);
    return docxDTO;
  }

  async processMoodleExam(file) {
    // Assuming Moodle XML is parsed from the content
    const xmlString = await this.readFileContent(file);

    const moodleData = MoodleXmlDTO.fromXML(xmlString);
    const moodleDTO = convertMoodleXmlDTOToJsonWithSections(moodleData);
    //return normaliseMoodleDTO(moodleDTO);
    return moodleDTO;
  }


  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

// Create and export a singleton instance
const examImportService = new ExamImportService();
export default examImportService;