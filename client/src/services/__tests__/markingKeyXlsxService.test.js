import { parseMarkingKeyXLSX, exportMarkingKeyToXLSX } from '../markingKeyXlsxService';
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

describe('Marking Key XLSX Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseMarkingKeyXLSX', () => {
    test('should parse a valid XLSX file', async () => {
      const { mockWorkbook, mockWorksheet } = require('exceljs');
      
      // Mock the ExcelJS data
      const mockRows = [
        ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer'],
        ['V1', '1', 1, '0123', 1],
        ['V1', '2', 2, '1032', 4],
        ['V2', '1', 1, '3210', 8]
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
      const result = await parseMarkingKeyXLSX(new ArrayBuffer(0));

      expect(result).toEqual({
        versions: ['V1', 'V2'],
        questionData: {
          '1': {
            markWeight: 1,
            versions: {
              'V1': { optionSequence: '0123', answer: 1 },
              'V2': { optionSequence: '3210', answer: 8 }
            }
          },
          '2': {
            markWeight: 2,
            versions: {
              'V1': { optionSequence: '1032', answer: 4 }
            }
          }
        }
      });
    });

    test('should throw error for empty XLSX file', async () => {
      const { mockWorkbook, mockWorksheet } = require('exceljs');
      
      // Mock empty XLSX file
      mockWorkbook.getWorksheet.mockReturnValue(mockWorksheet);
      mockWorksheet.eachRow.mockImplementation(() => {});

      await expect(parseMarkingKeyXLSX(new ArrayBuffer(0))).rejects.toThrow('XLSX file does not contain data rows');
    });

    test('should throw error for XLSX file with only header', async () => {
      const { mockWorkbook, mockWorksheet } = require('exceljs');
      
      // Mock XLSX with only header
      mockWorkbook.getWorksheet.mockReturnValue(mockWorksheet);
      mockWorksheet.eachRow.mockImplementation((callback) => {
        const headerRow = {
          eachCell: (cellCallback) => {
            ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer'].forEach((cell, cellIndex) => {
              cellCallback({ value: cell }, cellIndex + 1);
            });
          }
        };
        callback(headerRow, 1);
      });

      await expect(parseMarkingKeyXLSX(new ArrayBuffer(0))).rejects.toThrow('XLSX file does not contain data rows');
    });
  });

  describe('exportMarkingKeyToXLSX', () => {
    test('should export marking key data to XLSX format', async () => {
      const { mockWorkbook, mockWorksheet } = require('exceljs');
      
      const markingKeyData = {
        versions: ['V1', 'V2'],
        questionMappings: {
          '1': {
            'V1': {
              shuffleMap: [0, 1, 2, 3],
              correctAnswerIndices: [0]
            },
            'V2': {
              shuffleMap: [3, 2, 1, 0],
              correctAnswerIndices: [3]
            }
          },
          '2': {
            'V1': {
              shuffleMap: [1, 0, 3, 2],
              correctAnswerIndices: [2]
            }
          }
        },
        markWeights: {
          '1': 1,
          '2': 2
        }
      };

      // Mock ExcelJS functions
      mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);
      mockWorkbook.xlsx.writeBuffer.mockResolvedValue(new ArrayBuffer(8));

      // Export marking key
      const exportedBlob = await exportMarkingKeyToXLSX(markingKeyData);

      // Verify the result is a Blob
      expect(exportedBlob).toBeInstanceOf(Blob);
      expect(exportedBlob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      // Verify ExcelJS functions were called correctly
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith("Marking Key");
      expect(mockWorksheet.addRow).toHaveBeenCalled();
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
    });

    test('should handle complex marking key with multiple questions and versions', async () => {
      const { mockWorkbook, mockWorksheet } = require('exceljs');
      
      // Mock ExcelJS data for a marking key with 2 questions
      const markingKeyData = {
        versions: ['V1', 'V2'],
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
        markWeights: { '1': 1, '2': 2 }
      };

      // Setup ExcelJS mock
      mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);
      mockWorkbook.xlsx.writeBuffer.mockResolvedValue(new ArrayBuffer(8));

      // Export the mock XLSX
      const result = await exportMarkingKeyToXLSX(markingKeyData);

      // Verify it returns a Blob
      expect(result).toBeInstanceOf(Blob);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith("Marking Key");
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(5); // 1 header + 4 data rows
    });
  });
}); 