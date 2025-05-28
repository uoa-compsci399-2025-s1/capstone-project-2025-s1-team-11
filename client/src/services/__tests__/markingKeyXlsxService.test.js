import { parseMarkingKeyXLSX, exportMarkingKeyToXLSX } from '../markingKeyXlsxService';
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

describe('Marking Key XLSX Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('parseMarkingKeyXLSX', () => {
    test('should parse a valid XLSX file', () => {
      // Mock the XLSX data
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

      // Test the function
      const result = parseMarkingKeyXLSX(new ArrayBuffer(0));

      // Verify the results
      expect(result.versions).toEqual(['1', '2']);
      expect(result.questionData['1'].markWeight).toBe(2.5);
      expect(result.questionData['1'].versions['1'].optionSequence).toBe('10423');
      expect(result.questionData['1'].versions['1'].answer).toBe(2);
      expect(result.questionData['2'].versions['2'].optionSequence).toBe('14032');
      expect(result.questionData['2'].versions['2'].answer).toBe(4);
    });

    test('should handle empty file', () => {
      // Mock empty XLSX file
      XLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: 'mock-sheet'
        }
      });
      XLSX.utils.sheet_to_json.mockReturnValue([]);

      // Test the function throws error
      expect(() => parseMarkingKeyXLSX(new ArrayBuffer(0))).toThrow('XLSX file does not contain data rows');
    });

    test('should handle file with only header', () => {
      // Mock XLSX with only header
      XLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: 'mock-sheet'
        }
      });
      XLSX.utils.sheet_to_json.mockReturnValue([
        ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer']
      ]);

      // Test the function throws error
      expect(() => parseMarkingKeyXLSX(new ArrayBuffer(0))).toThrow('XLSX file does not contain data rows');
    });
  });

  describe('exportMarkingKeyToXLSX', () => {
    test('should export marking key data to XLSX format', () => {
      // Mock marking key data
      const markingKeyData = {
        versions: ['1', '2'],
        questionMappings: {
          '1': {
            '1': {
              shuffleMap: [1, 0, 4, 2, 3],
              correctAnswerIndices: [1]
            },
            '2': {
              shuffleMap: [0, 2, 1, 3, 4],
              correctAnswerIndices: [0]
            }
          },
          '2': {
            '1': {
              shuffleMap: [0, 3, 4, 1, 2],
              correctAnswerIndices: [0]
            },
            '2': {
              shuffleMap: [1, 4, 0, 3, 2],
              correctAnswerIndices: [2]
            }
          }
        },
        markWeights: {
          '1': 2.5,
          '2': 2.5
        }
      };

      // Mock XLSX functions
      XLSX.utils.book_new.mockReturnValue({});
      XLSX.utils.aoa_to_sheet.mockReturnValue({});
      XLSX.write.mockReturnValue(new ArrayBuffer(0));

      // Test the function
      const result = exportMarkingKeyToXLSX(markingKeyData);

      // Verify XLSX functions were called correctly
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.write).toHaveBeenCalled();

      // Verify the result is a Blob
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      // Verify the data passed to aoa_to_sheet
      const sheetData = XLSX.utils.aoa_to_sheet.mock.calls[0][0];
      expect(sheetData[0]).toEqual(['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer']);
      expect(sheetData.length).toBe(5); // Header + 4 data rows
    });
  });
}); 