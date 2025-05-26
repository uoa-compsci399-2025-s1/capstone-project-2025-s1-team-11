import { 
  parseMarkingKeyCSV, 
  createShuffleMapFromSequence,
  getCorrectAnswerIndices
} from '../markingKeyImportService';

describe('Marking Key Import Service', () => {
  describe('parseMarkingKeyCSV', () => {
    test('should parse a valid CSV file', () => {
      const csv = `VersionID,QuestionID,MarkWeight,OptionSequences,Answer
1,1,2.5,10423,2
1,2,2.5,03412,1
2,1,2.5,02134,1
2,2,2.5,14032,4`;
      
      const result = parseMarkingKeyCSV(csv);
      
      expect(result.versions).toEqual(['1', '2']);
      expect(result.questionData['1'].markWeight).toBe(2.5);
      expect(result.questionData['1'].versions['1'].optionSequence).toBe('10423');
      expect(result.questionData['1'].versions['1'].answer).toBe(2);
      expect(result.questionData['1'].versions['2'].optionSequence).toBe('02134');
      expect(result.questionData['1'].versions['2'].answer).toBe(1);
      expect(result.questionData['2'].versions['1'].optionSequence).toBe('03412');
      expect(result.questionData['2'].versions['1'].answer).toBe(1);
    });
    
    test('should handle empty file', () => {
      const csv = '';
      
      expect(() => parseMarkingKeyCSV(csv)).toThrow('CSV file does not contain data rows');
    });
    
    test('should handle file with only header', () => {
      const csv = 'VersionID,QuestionID,MarkWeight,OptionSequences,Answer';
      
      expect(() => parseMarkingKeyCSV(csv)).toThrow('CSV file does not contain data rows');
    });
  });
  
  describe('createShuffleMapFromSequence', () => {
    test('should convert option sequence to shuffle map correctly', () => {
      // Input: "10423" - means 0 is at position 1, 1 is at position 0, etc.
      // Output: [1,0,4,2,3] - means original 0 goes to position 1, original 1 goes to position 0, etc.
      const result = createShuffleMapFromSequence('10423');
      
      expect(result).toEqual([1, 0, 4, 2, 3]);
    });
    
    test('should handle different sequence lengths', () => {
      const result1 = createShuffleMapFromSequence('012');
      const result2 = createShuffleMapFromSequence('1234');
      
      expect(result1).toEqual([0, 1, 2]);
      expect(result2).toEqual([0, 1, 2, 3, 4]);
    });
  });
  
  describe('getCorrectAnswerIndices', () => {
    test('should convert bitmask to correct indices', () => {
      // Bitmask 1 = 2^0 = answer at index 0 is correct
      expect(getCorrectAnswerIndices(1, 5)).toEqual([0]);
      
      // Bitmask 2 = 2^1 = answer at index 1 is correct
      expect(getCorrectAnswerIndices(2, 5)).toEqual([1]);
      
      // Bitmask 4 = 2^2 = answer at index 2 is correct
      expect(getCorrectAnswerIndices(4, 5)).toEqual([2]);
      
      // Bitmask 8 = 2^3 = answer at index 3 is correct
      expect(getCorrectAnswerIndices(8, 5)).toEqual([3]);
      
      // Bitmask 16 = 2^4 = answer at index 4 is correct
      expect(getCorrectAnswerIndices(16, 5)).toEqual([4]);
      
      // Bitmask 5 = 1 + 4 = answers at indices 0 and 2 are correct
      expect(getCorrectAnswerIndices(5, 5)).toEqual([0, 2]);
      
      // Bitmask 10 = 2 + 8 = answers at indices 1 and 3 are correct
      expect(getCorrectAnswerIndices(10, 5)).toEqual([1, 3]);
    });
    
    test('should handle empty bitmask', () => {
      expect(getCorrectAnswerIndices(0, 5)).toEqual([]);
    });
    
    test('should handle all bits set', () => {
      expect(getCorrectAnswerIndices(31, 5)).toEqual([0, 1, 2, 3, 4]);
    });
  });
}); 