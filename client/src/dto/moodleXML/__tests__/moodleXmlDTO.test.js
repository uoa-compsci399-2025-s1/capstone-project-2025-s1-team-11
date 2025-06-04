import { MoodleXmlDTO, QuestionXmlDTO, AnswerXmlDTO } from '../moodleXmlDTO.js';

describe('MoodleXmlDTO', () => {
  describe('Basic XML Parsing', () => {
    const basicXML = `
      <quiz>
        <question type="multichoice">
          <name><text>Basic Question</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>What is 2+2?</p>]]></text>
          </questiontext>
          <generalfeedback format="html">
            <text>Good attempt!</text>
          </generalfeedback>
          <defaultgrade>1.0000000</defaultgrade>
          <answer fraction="100" format="html">
            <text><![CDATA[<p>4</p>]]></text>
            <feedback format="html"><text>Correct!</text></feedback>
          </answer>
          <answer fraction="0" format="html">
            <text><![CDATA[<p>5</p>]]></text>
            <feedback format="html"><text>Incorrect</text></feedback>
          </answer>
        </question>
      </quiz>
    `;

    test('should parse basic XML successfully', () => {
      const dto = MoodleXmlDTO.fromXML(basicXML);
      
      expect(dto.questions).toHaveLength(1);
      expect(dto.questions[0].type).toBe('multichoice');
      expect(dto.questions[0].name).toBe('Basic Question');
      expect(dto.questions[0].questionText).toContain('What is 2+2?');
      expect(dto.questions[0].defaultgrade).toBe(1.0);
    });

    test('should parse answers with correct fractions', () => {
      const dto = MoodleXmlDTO.fromXML(basicXML);
      const question = dto.questions[0];
      
      expect(question.answers).toHaveLength(2);
      expect(question.answers[0].fraction).toBe(100);
      expect(question.answers[0].text).toContain('4');
      expect(question.answers[1].fraction).toBe(0);
      expect(question.answers[1].text).toContain('5');
    });
  });

  describe('Image Handling', () => {
    const imageXML = `
      <quiz>
        <question type="multichoice">
          <name><text>Image Question</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>See image: <img src="@@PLUGINFILE@@/test.jpg" alt="test" /></p>]]></text>
            <file name="test.jpg" path="/" encoding="base64">iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==</file>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="100">
            <text>Correct</text>
          </answer>
        </question>
      </quiz>
    `;

    test('should replace @@PLUGINFILE@@ with base64 data URI', () => {
      const dto = MoodleXmlDTO.fromXML(imageXML);
      const question = dto.questions[0];
      
      expect(question.questionText).toContain('data:image/jpeg;base64,');
      expect(question.questionText).not.toContain('@@PLUGINFILE@@');
    });

    test('should extract images from question text', () => {
      const dto = MoodleXmlDTO.fromXML(imageXML);
      const question = dto.questions[0];
      
      expect(question.images).toHaveLength(1);
      expect(question.images[0].src).toContain('data:image/jpeg;base64,');
    });
  });

  describe('Question Types', () => {
    const multiTypeXML = `
      <quiz>
        <question type="description">
          <name><text>Section 1</text></name>
          <questiontext format="html">
            <text><![CDATA[<h3>Section Title</h3>]]></text>
          </questiontext>
        </question>
        <question type="multichoice">
          <name><text>MC Question</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Multiple choice?</p>]]></text>
          </questiontext>
          <defaultgrade>2.5</defaultgrade>
          <answer fraction="100"><text>A</text></answer>
          <answer fraction="0"><text>B</text></answer>
        </question>
        <question type="truefalse">
          <name><text>TF Question</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>True or false?</p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="100"><text>True</text></answer>
          <answer fraction="0"><text>False</text></answer>
        </question>
        <question type="category">
          <category><text>Category Name</text></category>
        </question>
      </quiz>
    `;

    test('should parse different question types', () => {
      const dto = MoodleXmlDTO.fromXML(multiTypeXML);
      
      expect(dto.questions).toHaveLength(4);
      expect(dto.questions[0].type).toBe('description');
      expect(dto.questions[1].type).toBe('multichoice');
      expect(dto.questions[2].type).toBe('truefalse');
      expect(dto.questions[3].type).toBe('category');
    });

    test('should handle decimal marks', () => {
      const dto = MoodleXmlDTO.fromXML(multiTypeXML);
      const mcQuestion = dto.questions[1];
      
      expect(mcQuestion.defaultgrade).toBe(2.5);
    });
  });

  describe('Text Formatting', () => {
    const formattingXML = `
      <quiz>
        <question type="multichoice">
          <name><text>Formatting Test</text></name>
          <questiontext format="html">
            <text><![CDATA[<p>Normal text <sub>subscript</sub> <sup>superscript</sup></p>]]></text>
          </questiontext>
          <defaultgrade>1.0</defaultgrade>
          <answer fraction="100">
            <text><![CDATA[<p>Answer with <strong>bold</strong> text</p>]]></text>
          </answer>
        </question>
      </quiz>
    `;

    test('should preserve HTML formatting', () => {
      const dto = MoodleXmlDTO.fromXML(formattingXML);
      const question = dto.questions[0];
      
      expect(question.questionText).toContain('<sub>subscript</sub>');
      expect(question.questionText).toContain('<sup>superscript</sup>');
      expect(question.answers[0].text).toContain('<strong>bold</strong>');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid XML gracefully', () => {
      const invalidXML = '<invalid>not a quiz</invalid>';
      
      expect(() => {
        MoodleXmlDTO.fromXML(invalidXML);
      }).toThrow('Invalid XML: missing <quiz> element');
    });

    test('should handle missing elements gracefully', () => {
      const incompleteXML = `
        <quiz>
          <question type="multichoice">
            <name><text>Incomplete</text></name>
            <!-- Missing questiontext and answers -->
          </question>
        </quiz>
      `;

      const dto = MoodleXmlDTO.fromXML(incompleteXML);
      expect(dto.questions).toHaveLength(1);
      expect(dto.questions[0].questionText).toBe('');
      expect(dto.questions[0].answers).toHaveLength(0);
    });
  });
}); 