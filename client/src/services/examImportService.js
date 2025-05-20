import { parseDocx } from '../dto/docx/docxParser.js';
import { MoodleXmlDTO } from '../dto/moodleXML/moodleXmlDTO.js'
import { parseLatex, isLikelyLatex } from '../dto/latex/latexParser.js';
import { convertMoodleXmlDTOToJsonWithSections } from '../utilities/convertMoodleXmlToJsonWithSections.js';
import { 
  importExamStart,
  importExamSuccess,
  importExamFailure,
  initialiseExamState,
  addSection,
  addQuestion,
  updateExamField,
  addExamMessage
} from '../store/exam/examSlice';

import { selectExamData } from '../store/exam/selectors.js';

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

// Thunk for importing an exam - intended behaviour is to add questions from the imported exam to the existing examBody.
// And if imported exam contains metadata, update the existing exam metadata.
// However we do not want to clear existing exam metadata or replace existing questions.
export const importDTOToState = (examDTO) => async (dispatch, getState) => {
  try {
    dispatch(importExamStart());
    //let's check if an exam is already loaded, if so update exam metadata where imported exam has metadate.
    const examData = selectExamData(getState());
    let importMessages = [];

    // This initialises an exam if somehow an import is attempted before an exam is loaded/created. Typically 
    // import before exam load/creation would be disabled.
    if (!examData) {
      const message = "No existing exam found. Default properties will be loaded. Change in exam settings if required and re-import.";
      console.log(message);
      console.log(`examDTO: ${JSON.stringify(examDTO.examTitle)}`);
      importMessages.push(message);
      const examProps = {};
      Object.keys(examDTO).forEach(key => {
        if (key !== 'examBody' && examDTO[key]) {
          examProps[key] = examDTO[key];
        }
      });
      
      dispatch(initialiseExamState(examProps));
      console.log(`examData: ${JSON.stringify(examData)}`);
    } else {
      Object.keys(examDTO).forEach(key => {
        if (key !== 'examBody' && examData[key] && examDTO[key] && examData[key] != examDTO[key]) {
          dispatch(updateExamField({
            field: key,
            value: examDTO[key]
          }));
          importMessages.push(`${key} updated to ${examDTO[key]} by imported exam.`);
        }
      });
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
    importMessages.forEach(message => dispatch(addExamMessage(message)));
    dispatch(importExamSuccess()); 

    return;
  } catch (error) {
    dispatch(importExamFailure(error.message));
    throw error;
  }
};

// Create and export a singleton instance
const examImportService = new ExamImportService();
export default examImportService;