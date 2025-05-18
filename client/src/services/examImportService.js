//import { parseExamDocx } from '../dto/DOCX_Exam_DTO';

import { parseDocx } from '../dto/docx/docxParser.js';
import { MoodleXmlDTO } from '../dto/moodleXML/moodleXmlDTO.js'
import { parseLatex } from '../dto/latex/latexParser.js';
//import { normaliseDocxDTO, normaliseMoodleDTO } from './normalisers.js'; // Helper functions for normalization
//import { convertMoodleXmlToJson } from '../utilities/convertMoodleXmlToJson.js';
import { convertMoodleXmlDTOToJsonWithSections } from '../utilities/convertMoodleXmlToJsonWithSections.js';
import { 
  importExamStart,
  importExamSuccess,
  importExamFailure,
  clearExamState,
  initializeExamState,
  addSection,
  addQuestion,
  setExamVersions,
  setTeleformOptions
} from '../store/exam/examSlice';

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
    console.log("Importing exam to DTO with format:", format);
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
    // Read the file content first
    const latexContent = await this.readFileContent(file);
    
    // Parse LaTeX content and return DTO
    const latexDTO = parseLatex(latexContent);
    return latexDTO;
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

// Thunk for importing an exam properly
export const importDTOToState = (examDTO) => async (dispatch) => {
  try {
    dispatch(importExamStart());

    dispatch(clearExamState());

    dispatch(initializeExamState({
      examTitle: examDTO.examTitle,
      courseCode: examDTO.courseCode,
      courseName: examDTO.courseName,
      semester: examDTO.semester,
      year: examDTO.year,
    }));

    // Set versions and teleform options if needed
    if (examDTO.versions) {
      dispatch(setExamVersions(examDTO.versions));
    }
    if (examDTO.teleformOptions) {
      dispatch(setTeleformOptions(examDTO.teleformOptions));
    }

    let examBodyIndexCounter = 0;

    // Import the examBody (sections and/or questions)
    for (const item of examDTO.examBody || []) {
      try {
        if (item.type === 'section') {
          const sectionWithoutQuestions = { ...item };
          delete sectionWithoutQuestions.questions;
          await dispatch(addSection(sectionWithoutQuestions));
          
          for (const question of item.questions || []) {
            await dispatch(addQuestion({ 
              examBodyIndex: examBodyIndexCounter, 
              questionData: question 
            }));
          }
        } else {
          await dispatch(addQuestion({ 
            examBodyIndex: null, 
            questionData: item 
          }));
        }
        examBodyIndexCounter++;
      } catch (error) {
        console.error(`Error while processing item:`, item);
        console.error(error);
        throw error;  // still rethrow to trigger importExamFailure
      }
    }

    dispatch(importExamSuccess()); // You could even repurpose this to mean "done loading"

    return;
  } catch (error) {
    dispatch(importExamFailure(error.message));
    throw error;
  }
};

// Create and export a singleton instance
const examImportService = new ExamImportService();
export default examImportService;