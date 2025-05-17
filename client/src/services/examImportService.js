//import { parseExamDocx } from '../dto/DOCX_Exam_DTO';

import { parseDocx } from '../dto/docx/docxParser.js';
import { MoodleXmlDTO } from '../dto/moodleXML/moodleXmlDTO.js'
import { parseLatex, isLikelyLatex } from '../dto/latex/latexParser.js';
//import { normaliseDocxDTO, normaliseMoodleDTO } from './normalisers.js'; // Helper functions for normalization
//import { convertMoodleXmlToJson } from '../utilities/convertMoodleXmlToJson.js';
import { convertMoodleXmlDTOToJsonWithSections } from '../utilities/convertMoodleXmlToJsonWithSections.js';

// This service handles the import of exams from various formats
export class ExamImportService {
  constructor() {
    this.importFormats = {
      'docx': this.processDocxExam.bind(this),
      'moodle': this.processMoodleExam.bind(this),
      'latex': this.processLatexExam.bind(this)
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

  async processLatexExam(file) {
    try {
      // Read the file content first
      const latexContent = await this.readFileContent(file);
      
      // Validate that this looks like a LaTeX file
      if (!isLikelyLatex(latexContent)) {
        throw new Error("The provided file does not appear to be a valid LaTeX document");
      }
      
      // Parse LaTeX content and return DTO
      const latexDTO = parseLatex(latexContent);
      
      // Validate the returned DTO has the expected structure
      if (!latexDTO || !latexDTO.examBody || !Array.isArray(latexDTO.examBody)) {
        throw new Error("Failed to extract exam structure from LaTeX document");
      }
      
      return latexDTO;
    } catch (error) {
      console.error("Error processing LaTeX exam:", error);
      throw new Error(`LaTeX processing error: ${error.message}`);
    }
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