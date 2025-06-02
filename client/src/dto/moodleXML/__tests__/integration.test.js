import { MoodleXmlDTO } from '../moodleXmlDTO.js';
import { convertMoodleXmlDTOToJsonWithSections } from '../../../utilities/convertMoodleXmlToJsonWithSections.js';
import fs from 'fs';
import path from 'path';

// This test will use your real-world test XML file once uploaded
describe('MoodleXML Integration Tests', () => {
  let testXmlContent;
  let expectedOutput;

  beforeAll(() => {
    // Load the test XML file
    const testXmlPath = path.join(__dirname, 'testData', 'moodleTestCases.xml');
    const expectedOutputPath = path.join(__dirname, 'testData', 'expected-output.json');
    
    try {
      testXmlContent = fs.readFileSync(testXmlPath, 'utf8');
      expectedOutput = JSON.parse(fs.readFileSync(expectedOutputPath, 'utf8'));
    } catch (error) {
      console.warn('Test files not found:', error.message);
      testXmlContent = null;
      expectedOutput = null;
    }
  });

  describe('Real-World XML Import', () => {
    test('should import comprehensive test XML successfully', () => {
      // Skip this test until the XML file is uploaded
      if (!testXmlContent) {
        console.log('Skipping test - upload moodleTestCases.xml to run this test');
        return;
      }

      // Parse the XML
      const moodleDto = MoodleXmlDTO.fromXML(testXmlContent);
      expect(moodleDto.questions.length).toBeGreaterThan(0);

      // Convert to exam format
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);
      expect(result.examBody.length).toBeGreaterThan(0);

      // Verify sections are sorted first
      const sections = result.examBody.filter(item => item.type === 'section');
      const questions = result.examBody.filter(item => item.type === 'question');
      
      if (sections.length > 0 && questions.length > 0) {
        const firstSectionIndex = result.examBody.findIndex(item => item.type === 'section');
        const firstQuestionIndex = result.examBody.findIndex(item => item.type === 'question');
        expect(firstSectionIndex).toBeLessThan(firstQuestionIndex);
      }

      // Expected results based on generation
      expect(result.examBody.length).toBe(15); // 2 sections + 13 questions
      expect(sections.length).toBe(2);
      expect(questions.length).toBe(13);
      
      // Verify total marks
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      expect(totalMarks).toBe(14.5);
      
      // Verify questions with images
      const questionsWithImages = questions.filter(q => 
        q.contentFormatted.includes('data:image')
      );
      expect(questionsWithImages.length).toBe(1);
    });

    test('should handle all expected question types', () => {
      if (!testXmlContent) return;

      const moodleDto = MoodleXmlDTO.fromXML(testXmlContent);
      
      // Should have parsed 17 questions from XML
      expect(moodleDto.questions.length).toBe(17);
      
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);
      
      // Should have filtered to 15 items (2 sections + 13 questions)
      // This means 2 unsupported question types were filtered out
      expect(result.examBody.length).toBe(15);
      
      // All remaining items should be supported types
      result.examBody.forEach(item => {
        expect(['section', 'question']).toContain(item.type);
      });
    });

    test('should process images correctly', () => {
      if (!testXmlContent) return;

      const moodleDto = MoodleXmlDTO.fromXML(testXmlContent);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      // Check for image processing
      const questionsWithImages = result.examBody.filter(item => 
        item.contentFormatted && item.contentFormatted.includes('data:image')
      );

      expect(questionsWithImages.length).toBe(2);
      
      questionsWithImages.forEach(question => {
        // Should not contain @@PLUGINFILE@@ references
        expect(question.contentFormatted).not.toContain('@@PLUGINFILE@@');
        
        // Should contain properly formatted data URIs
        expect(question.contentFormatted).toMatch(/data:image\/[^;]+;base64,/);
      });
    });
  });

  describe('Expected Output Validation', () => {
    test('should match expected output structure for regression testing', () => {
      if (!testXmlContent || !expectedOutput) {
        console.log('Skipping regression test - files not available');
        return;
      }

      const moodleDto = MoodleXmlDTO.fromXML(testXmlContent);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      // Compare against expected output for regression testing
      expect(result).toEqual(expectedOutput);
    });

    test('should validate output structure', () => {
      if (!expectedOutput) return;

      // Validate the structure
      expect(expectedOutput).toHaveProperty('examBody');
      expect(Array.isArray(expectedOutput.examBody)).toBe(true);
      
      expectedOutput.examBody.forEach(item => {
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('contentFormatted');
        expect(item).toHaveProperty('format');
        
        if (item.type === 'question') {
          expect(item).toHaveProperty('marks');
          expect(item).toHaveProperty('answers');
          expect(Array.isArray(item.answers)).toBe(true);
          
          // Validate answers have correct property
          item.answers.forEach(answer => {
            expect(answer).toHaveProperty('correct');
            expect(typeof answer.correct).toBe('boolean');
          });
        }
        
        if (item.type === 'section') {
          expect(item).toHaveProperty('sectionTitle');
        }
      });
    });
  });
});

// Helper function to create expected output file
// Run this once with your test XML to generate the expected output
export const generateExpectedOutput = (xmlContent) => {
  const moodleDto = MoodleXmlDTO.fromXML(xmlContent);
  const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);
  
  // Save to testData/expected-output.json
  const outputPath = path.join(__dirname, 'testData', 'expected-output.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  
  console.log(`Expected output saved to ${outputPath}`);
  return result;
}; 