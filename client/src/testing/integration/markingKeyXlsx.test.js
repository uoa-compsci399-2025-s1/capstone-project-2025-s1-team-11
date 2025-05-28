import { configureStore } from '@reduxjs/toolkit';
import examReducer, { initialiseExamState, addQuestion, importMarkingKey, clearExamState } from '../../store/exam/examSlice';
import { selectExamData, selectAllQuestionsFlat, selectCorrectAnswerIndices } from '../../store/exam/selectors';
import { parseMarkingKeyXLSX, exportMarkingKeyToXLSX } from '../../services/markingKeyXlsxService';
import * as XLSX from 'xlsx';

// Mock XLSX module
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
    aoa_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn()
  },
  write: jest.fn()
}));

describe('Marking Key XLSX Integration', () => {
  let store;

  beforeEach(() => {
    // Create a fresh store before each test
    store = configureStore({
      reducer: {
        exam: examReducer
      }
    });

    // Initialize with a basic exam
    store.dispatch(initialiseExamState({
      examTitle: 'Test Exam',
      examBody: []
    }));

    // Clear XLSX mocks
    jest.clearAllMocks();
  });

  test('should import marking key and update exam state correctly', async () => {
    // Setup initial exam with questions
    store.dispatch(addQuestion({
      questionData: {
        contentFormatted: 'Question 1',
        marks: 2.5,
        answers: [
          { contentFormatted: 'A', correct: false },
          { contentFormatted: 'B', correct: true },
          { contentFormatted: 'C', correct: false },
          { contentFormatted: 'D', correct: false },
          { contentFormatted: 'E', correct: false }
        ]
      }
    }));

    store.dispatch(addQuestion({
      questionData: {
        contentFormatted: 'Question 2',
        marks: 2.5,
        answers: [
          { contentFormatted: 'A', correct: true },
          { contentFormatted: 'B', correct: false },
          { contentFormatted: 'C', correct: false },
          { contentFormatted: 'D', correct: false },
          { contentFormatted: 'E', correct: false }
        ]
      }
    }));

    // Mock XLSX data
    const mockRows = [
      ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer'],
      ['1', '1', 2.5, '10423', 2],
      ['1', '2', 2.5, '03412', 1],
      ['2', '1', 2.5, '02134', 1],
      ['2', '2', 2.5, '14032', 4]
    ];

    // Setup XLSX mock
    XLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: 'mock-sheet'
      }
    });
    XLSX.utils.sheet_to_json.mockReturnValue(mockRows);

    // Parse the mock XLSX
    const parsedData = parseMarkingKeyXLSX(new ArrayBuffer(0));

    // Import the marking key
    store.dispatch(importMarkingKey({
      versions: parsedData.versions,
      questionMappings: {},
      markWeights: {}
    }));

    // Get the updated state
    const examData = selectExamData(store.getState());
    const questions = selectAllQuestionsFlat(store.getState());
    const correctAnswers = selectCorrectAnswerIndices(store.getState());

    // Verify the exam state was updated correctly
    expect(examData.versions).toEqual(['1', '2']);
    expect(questions).toHaveLength(2);
    expect(questions[0].marks).toBe(2.5);
    expect(questions[1].marks).toBe(2.5);

    // Test exporting the marking key
    const markingKeyData = {
      versions: examData.versions,
      questionMappings: {},
      markWeights: {}
    };

    // Prepare data for export
    questions.forEach(question => {
      markingKeyData.questionMappings[question.questionNumber] = {};
      markingKeyData.markWeights[question.questionNumber] = question.marks;

      examData.versions.forEach(versionId => {
        markingKeyData.questionMappings[question.questionNumber][versionId] = {
          shuffleMap: question.answerShuffleMaps[examData.versions.indexOf(versionId)],
          correctAnswerIndices: correctAnswers[versionId][question.questionNumber] || []
        };
      });
    });

    // Export the marking key
    const exportedBlob = exportMarkingKeyToXLSX(markingKeyData);

    // Verify export
    expect(exportedBlob).toBeInstanceOf(Blob);
    expect(exportedBlob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Verify XLSX functions were called correctly
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.write).toHaveBeenCalled();
  });

  test('should handle importing marking key with no exam loaded', async () => {
    // Mock XLSX data for a marking key with 2 questions
    const mockRows = [
      ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer'],
      ['1', '1', 2.5, '10423', 2],
      ['1', '2', 2.5, '03412', 1]
    ];

    // Setup XLSX mock
    XLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: 'mock-sheet'
      }
    });
    XLSX.utils.sheet_to_json.mockReturnValue(mockRows);

    // Parse the mock XLSX
    const parsedData = parseMarkingKeyXLSX(new ArrayBuffer(0));

    // Create the marking key data with proper mappings
    const markingKeyData = {
      versions: parsedData.versions,
      questionMappings: {},
      markWeights: {}
    };

    // Process each question in the parsed data
    Object.entries(parsedData.questionData).forEach(([questionNumber, data]) => {
      markingKeyData.markWeights[questionNumber] = data.markWeight;
      markingKeyData.questionMappings[questionNumber] = {};
      
      // For each version of this question
      Object.entries(data.versions).forEach(([versionId, versionData]) => {
        // Convert the option sequence to a shuffle map
        const sequence = versionData.optionSequence.split('').map(c => parseInt(c, 10));
        
        // Create a proper shuffle map (originalIndex → newIndex)
        const shuffleMap = new Array(sequence.length).fill(0);
        for (let newIndex = 0; newIndex < sequence.length; newIndex++) {
          const originalIndex = sequence[newIndex];
          shuffleMap[originalIndex] = newIndex;
        }
        
        // Calculate correct answer indices from the answer bitmask
        const correctAnswerIndices = [];
        for (let i = 0; i < sequence.length; i++) {
          const bitValue = 1 << i;
          if ((versionData.answer & bitValue) !== 0) {
            correctAnswerIndices.push(i);
          }
        }
        
        // Store the mapping data
        markingKeyData.questionMappings[questionNumber][versionId] = {
          shuffleMap,
          correctAnswerIndices
        };
      });
    });

    // Clear the exam state before importing
    store.dispatch(clearExamState());

    // Import the marking key
    store.dispatch(importMarkingKey(markingKeyData));

    // Get the updated state
    const examData = selectExamData(store.getState());
    const questions = selectAllQuestionsFlat(store.getState());

    // Verify the exam state was updated correctly
    expect(examData.versions).toEqual(['1']);
    expect(questions).toHaveLength(2);
    expect(questions[0].marks).toBe(2.5);
    expect(questions[1].marks).toBe(2.5);

    // Verify the first question's shuffle map and correct answers
    expect(questions[0].answerShuffleMaps[0]).toEqual([1, 0, 3, 4, 2]); // From '10423'
    expect(questions[0].answers[0].correct).toBe(true); // Answer at index 0 maps to position 1, which is correct
    expect(questions[0].answers[1].correct).toBe(false);

    // Verify the second question's shuffle map and correct answers
    expect(questions[1].answerShuffleMaps[0]).toEqual([0, 3, 4, 1, 2]); // From '03412'
    expect(questions[1].answers[0].correct).toBe(true); // Answer at index 0 maps to position 0, which is correct
    expect(questions[1].answers[1].correct).toBe(false);
  });
}); 