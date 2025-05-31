import { configureStore } from '@reduxjs/toolkit';
import examReducer, { importMarkingKey } from '../../store/exam/examSlice';
import { parseMarkingKeyXLSX, exportMarkingKeyToXLSX } from '../../services/markingKeyXlsxService';
import ExcelJS from 'exceljs';

// Mock ExcelJS module
jest.mock('exceljs', () => {
  const mockWorkbook = {
    getWorksheet: jest.fn(),
    addWorksheet: jest.fn(),
    xlsx: {
      load: jest.fn(),
      writeBuffer: jest.fn(),
    }
  };

  const mockWorksheet = {
    eachRow: jest.fn(),
    addRow: jest.fn(),
  };

  return {
    __esModule: true,
    default: {
      Workbook: jest.fn(() => mockWorkbook)
    },
    mockWorkbook,
    mockWorksheet
  };
});

describe('Marking Key XLSX Integration', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        exam: examReducer,
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear ExcelJS mocks
    jest.clearAllMocks();
  });

  test('should parse XLSX and update Redux store', async () => {
    const { mockWorkbook, mockWorksheet } = require('exceljs');

    // Mock data
    const mockMarkingKeyData = [
      ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer'],
      ['V1', '1', 2.5, '10423', 2],
      ['V1', '2', 2.5, '03412', 1],
      ['V2', '1', 2.5, '02134', 1],
      ['V2', '2', 2.5, '14032', 4]
    ];

    // Setup ExcelJS mock
    mockWorkbook.getWorksheet.mockReturnValue(mockWorksheet);
    mockWorksheet.eachRow.mockImplementation((callback) => {
      mockMarkingKeyData.forEach((row, index) => {
        const mockRow = {
          eachCell: (cellCallback) => {
            row.forEach((cell, cellIndex) => {
              cellCallback({ value: cell }, cellIndex + 1);
            });
          }
        };
        callback(mockRow, index + 1);
      });
    });

    // Parse marking key
    const parsedData = await parseMarkingKeyXLSX(new ArrayBuffer(0));

    // Dispatch to Redux store using the proper examSlice action
    store.dispatch(importMarkingKey({
      versions: parsedData.versions,
      questionMappings: {
        '1': {
          'V1': { shuffleMap: [0, 1, 2, 3], correctAnswerIndices: [0] },
          'V2': { shuffleMap: [3, 2, 1, 0], correctAnswerIndices: [3] }
        },
        '2': {
          'V1': { shuffleMap: [1, 0, 3, 2], correctAnswerIndices: [2] },
          'V2': { shuffleMap: [2, 3, 0, 1], correctAnswerIndices: [1] }
        }
      },
      markWeights: {
        '1': 2.5,
        '2': 2.5
      }
    }));

    // Verify Redux state was updated
    const state = store.getState();
    expect(state.exam.examData.versions).toEqual(['V1', 'V2']);
    expect(state.exam.examData.examBody).toHaveLength(2); // Should have created 2 questions
  });

  test('should export Redux state to XLSX', async () => {
    const { mockWorkbook, mockWorksheet } = require('exceljs');

    // Setup Redux state
    const markingKeyData = {
      versions: ['V1', 'V2'],
      questionMappings: {
        '1': {
          'V1': {
            shuffleMap: [1, 0, 4, 2, 3],
            correctAnswerIndices: [1]
          },
          'V2': {
            shuffleMap: [0, 2, 1, 3, 4],
            correctAnswerIndices: [0]
          }
        }
      },
      markWeights: {
        '1': 2.5
      }
    };

    // Mock ExcelJS functions
    mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(new ArrayBuffer(8));

    // Export marking key
    const exportedBlob = await exportMarkingKeyToXLSX(markingKeyData);

    // Verify export
    expect(exportedBlob).toBeInstanceOf(Blob);
    expect(exportedBlob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Verify ExcelJS functions were called correctly
    expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith("Marking Key");
    expect(mockWorksheet.addRow).toHaveBeenCalled();
    expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
  });

  test('should handle complex marking key with multiple questions', async () => {
    const { mockWorkbook, mockWorksheet } = require('exceljs');

    // Mock ExcelJS data for a marking key with 2 questions
    const mockRows = [
      ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer'],
      ['V1', '1', 2.5, '10423', 2],
      ['V1', '2', 2.5, '03412', 1],
      ['V2', '1', 2.5, '02134', 1],
      ['V2', '2', 2.5, '14032', 4]
    ];

    // Setup ExcelJS mock
    mockWorkbook.getWorksheet.mockReturnValue(mockWorksheet);
    mockWorksheet.eachRow.mockImplementation((callback) => {
      mockRows.forEach((row, index) => {
        const mockRow = {
          eachCell: (cellCallback) => {
            row.forEach((cell, cellIndex) => {
              cellCallback({ value: cell }, cellIndex + 1);
            });
          }
        };
        callback(mockRow, index + 1);
      });
    });

    // Parse the mock XLSX
    const parsedData = await parseMarkingKeyXLSX(new ArrayBuffer(0));

    // Verify parsed structure
    expect(parsedData.versions).toEqual(['V1', 'V2']);
    expect(Object.keys(parsedData.questionData)).toEqual(['1', '2']);
    expect(parsedData.questionData['1'].markWeight).toBe(2.5);
    expect(parsedData.questionData['1'].versions['V1'].optionSequence).toBe('10423');
  });
}); 