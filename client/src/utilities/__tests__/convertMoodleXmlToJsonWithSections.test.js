import { convertMoodleXmlDTOToJsonWithSections } from '../convertMoodleXmlToJsonWithSections.js';
import { MoodleXmlDTO } from '../../dto/moodleXML/moodleXmlDTO.js';

describe('convertMoodleXmlDTOToJsonWithSections', () => {
  
  describe('Section Sorting', () => {
    const mixedOrderXML = `
      <quiz>
        <question type="multichoice">
          <name><text>Question 1</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>First question</p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="100"><text>A</text></answer>
          <answer fraction="0"><text>B</text></answer>
        </question>
        <question type="description">
          <name><text>Section 1</text></name>
          <questiontext format="html">
            <text><![CDATA[<h3>First Section</h3>]]></text>
          </questiontext>
        </question>
        <question type="multichoice">
          <name><text>Question 2</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Second question</p>]]></text>
          </questiontext>
          <defaultgrade>2.0</defaultgrade>
          <answer fraction="50"><text>C</text></answer>
          <answer fraction="100"><text>D</text></answer>
        </question>
        <question type="description">
          <name><text>Section 2</text></name>
          <questiontext format="html">
            <text><![CDATA[<h3>Second Section</h3>]]></text>
          </questiontext>
        </question>
      </quiz>
    `;

    test('should sort sections before questions', () => {
      const moodleDto = MoodleXmlDTO.fromXML(mixedOrderXML);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      expect(result.examBody).toHaveLength(4);
      
      // First two items should be sections
      expect(result.examBody[0].type).toBe('section');
      expect(result.examBody[0].sectionTitle).toBe('Section 1');
      expect(result.examBody[1].type).toBe('section');
      expect(result.examBody[1].sectionTitle).toBe('Section 2');
      
      // Last two items should be questions
      expect(result.examBody[2].type).toBe('question');
      expect(result.examBody[2].contentFormatted).toContain('First question');
      expect(result.examBody[3].type).toBe('question');
      expect(result.examBody[3].contentFormatted).toContain('Second question');
    });
  });

  describe('Question Type Filtering', () => {
    const multiTypeXML = `
      <quiz>
        <question type="multichoice">
          <name><text>MC Question</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Multiple choice</p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="100"><text>Correct</text></answer>
          <answer fraction="0"><text>Wrong</text></answer>
        </question>
        <question type="truefalse">
          <name><text>TF Question</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>True/False</p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="100"><text>True</text></answer>
          <answer fraction="0"><text>False</text></answer>
        </question>
        <question type="calculatedmulti">
          <name><text>Calc Question</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Calculated</p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="100"><text>Answer</text></answer>
        </question>
        <question type="calculated">
          <name><text>Unsupported</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Not supported</p>]]></text>
          </questiontext>
        </question>
        <question type="category">
          <category><text>Category</text></category>
        </question>
      </quiz>
    `;

    test('should only import supported question types', () => {
      const moodleDto = MoodleXmlDTO.fromXML(multiTypeXML);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      // Should have 3 questions (multichoice, truefalse, calculatedmulti)
      // calculated and category should be filtered out
      expect(result.examBody).toHaveLength(3);
      
      const questionTypes = result.examBody.map(item => 
        item.contentFormatted.includes('Multiple choice') ? 'multichoice' :
        item.contentFormatted.includes('True/False') ? 'truefalse' :
        item.contentFormatted.includes('Calculated') ? 'calculatedmulti' : 'unknown'
      );
      
      expect(questionTypes).toContain('multichoice');
      expect(questionTypes).toContain('truefalse');
      expect(questionTypes).toContain('calculatedmulti');
      expect(questionTypes).not.toContain('unknown');
    });
  });

  describe('Marks Extraction', () => {
    const marksXML = `
      <quiz>
        <question type="multichoice">
          <name><text>XML Marks</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Question with XML marks</p>]]></text>
          </questiontext>
          <defaultgrade>2.5000000</defaultgrade>
          <answer fraction="100"><text>A</text></answer>
          <answer fraction="0"><text>B</text></answer>
        </question>
        <question type="multichoice">
          <name><text>Text Marks</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>[3 marks] Question with text marks</p>]]></text>
          </questiontext>
          <defaultgrade>1.0000000</defaultgrade>
          <answer fraction="100"><text>A</text></answer>
          <answer fraction="0"><text>B</text></answer>
        </question>
        <question type="multichoice">
          <name><text>No Marks</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Question with no marks specified</p>]]></text>
          </questiontext>
          <answer fraction="100"><text>A</text></answer>
          <answer fraction="0"><text>B</text></answer>
        </question>
      </quiz>
    `;

    test('should prioritize defaultgrade over text marks', () => {
      const moodleDto = MoodleXmlDTO.fromXML(marksXML);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      expect(result.examBody).toHaveLength(3);
      
      // First question should use XML marks (2.5)
      expect(result.examBody[0].marks).toBe(2.5);
      
      // Second question should use text marks (3), not XML marks (1.0)
      expect(result.examBody[1].marks).toBe(3);
      
      // Third question should default to 1
      expect(result.examBody[2].marks).toBe(1);
    });

    test('should handle decimal marks in text', () => {
      const decimalMarksXML = `
        <quiz>
          <question type="multichoice">
            <name><text>Decimal Text Marks</text></name>
            <questiontext format="html">
              <text><![CDATA[<p>[1.5 marks] Question with decimal text marks</p>]]></text>
            </questiontext>
            <defaultgrade>1.0</defaultgrade>
            <answer fraction="100"><text>A</text></answer>
          </question>
        </quiz>
      `;

      const moodleDto = MoodleXmlDTO.fromXML(decimalMarksXML);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      expect(result.examBody[0].marks).toBe(1.5);
    });
  });

  describe('Correct Answer Detection', () => {
    const correctAnswersXML = `
      <quiz>
        <question type="multichoice">
          <name><text>Full Credit</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Question with 100% answer</p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="100"><text>Correct (100%)</text></answer>
          <answer fraction="0"><text>Wrong (0%)</text></answer>
        </question>
        <question type="multichoice">
          <name><text>Partial Credit</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Question with partial credit</p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="60"><text>Mostly correct (60%)</text></answer>
          <answer fraction="30"><text>Partially correct (30%)</text></answer>
          <answer fraction="0"><text>Wrong (0%)</text></answer>
        </question>
        <question type="multichoice">
          <name><text>Multiple Correct</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Question with multiple correct answers</p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="50"><text>Correct A (50%)</text></answer>
          <answer fraction="50"><text>Correct B (50%)</text></answer>
          <answer fraction="0"><text>Wrong (0%)</text></answer>
        </question>
      </quiz>
    `;

    test('should handle fraction-based correct answers', () => {
      const moodleDto = MoodleXmlDTO.fromXML(correctAnswersXML);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      expect(result.examBody).toHaveLength(3);
      
      // First question: 100% should be correct, 0% should be incorrect
      expect(result.examBody[0].answers[0].correct).toBe(true);  // 100%
      expect(result.examBody[0].answers[1].correct).toBe(false); // 0%
      
      // Second question: >= 50% should be correct, < 50% should be incorrect
      expect(result.examBody[1].answers[0].correct).toBe(true);  // 60%
      expect(result.examBody[1].answers[1].correct).toBe(false); // 30%
      expect(result.examBody[1].answers[2].correct).toBe(false); // 0%
      
      // Third question: both 50% answers should be correct
      expect(result.examBody[2].answers[0].correct).toBe(true);  // 50%
      expect(result.examBody[2].answers[1].correct).toBe(true);  // 50%
      expect(result.examBody[2].answers[2].correct).toBe(false); // 0%
    });
  });

  describe('Section Creation', () => {
    const sectionXML = `
      <quiz>
        <question type="description">
          <name><text>Math Section</text></name>
          <questiontext format="html">
            <text><![CDATA[<h3>Mathematics Questions</h3><p>Answer all questions in this section.</p>]]></text>
          </questiontext>
        </question>
      </quiz>
    `;

    test('should create sections from description questions', () => {
      const moodleDto = MoodleXmlDTO.fromXML(sectionXML);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      expect(result.examBody).toHaveLength(1);
      expect(result.examBody[0].type).toBe('section');
      expect(result.examBody[0].sectionTitle).toBe('Math Section');
      expect(result.examBody[0].contentFormatted).toContain('Mathematics Questions');
      expect(result.examBody[0].format).toBe('HTML');
    });
  });

  describe('Integration Test', () => {
    test('should handle complete XML with all features', () => {
      const completeXML = `
        <quiz>
          <question type="multichoice">
            <name><text>First Question</text></name>
            <questiontext format="html">
              <text><![CDATA[<p>What is <sub>2</sub><sup>3</sup>?</p>]]></text>
            </questiontext>
            <defaultgrade>1.5</defaultgrade>
            <answer fraction="100"><text>8</text></answer>
            <answer fraction="0"><text>6</text></answer>
          </question>
          <question type="description">
            <name><text>Section A</text></name>
            <questiontext format="html">
              <text><![CDATA[<h2>Section A: Basic Math</h2>]]></text>
            </questiontext>
          </question>
          <question type="truefalse">
            <name><text>TF Question</text></name>
            <questiontext format="html">
              <text><![CDATA[<p>[2 marks] 2 + 2 = 4</p>]]></text>
            </questiontext>
            <defaultgrade>1.0</defaultgrade>
            <answer fraction="100"><text>True</text></answer>
            <answer fraction="0"><text>False</text></answer>
          </question>
          <question type="calculated">
            <name><text>Unsupported Type</text></name>
            <questiontext format="html">
              <text><![CDATA[<p>This should be filtered out</p>]]></text>
            </questiontext>
          </question>
        </quiz>
      `;

      const moodleDto = MoodleXmlDTO.fromXML(completeXML);
      const result = convertMoodleXmlDTOToJsonWithSections(moodleDto);

      // Should have section first, then questions (unsupported question filtered out)
      expect(result.examBody).toHaveLength(3);
      
      // Section should be first
      expect(result.examBody[0].type).toBe('section');
      expect(result.examBody[0].sectionTitle).toBe('Section A');
      
      // Questions should follow
      expect(result.examBody[1].type).toBe('question');
      expect(result.examBody[1].marks).toBe(1.5); // From defaultgrade
      expect(result.examBody[1].contentFormatted).toContain('<sub>2</sub><sup>3</sup>');
      
      expect(result.examBody[2].type).toBe('question');
      expect(result.examBody[2].marks).toBe(2); // From text marks, not defaultgrade
      expect(result.examBody[2].answers[0].correct).toBe(true); // True answer
      expect(result.examBody[2].answers[1].correct).toBe(false); // False answer
    });
  });
}); 