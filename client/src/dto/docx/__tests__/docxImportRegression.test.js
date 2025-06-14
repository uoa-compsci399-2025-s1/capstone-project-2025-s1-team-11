import { parseDocx } from '../docxParser.js';
import fs from 'fs';
import path from 'path';

// Define test fixtures directory - Jest compatible approach
const fixturesDir = path.join(process.cwd(), 'src', 'dto', 'docx', '__tests__', 'fixtures');

// Test cases - pairs of DOCX files and their expected JSON outputs
const testCases = [
  {
    name: 'Combined Edge Cases',
    docxFile: 'edge-cases/Combined Edge Cases.docx',
    jsonFile: 'edge-cases/Combined Edge Cases.json',
    description: 'Tests various edge cases in document structure and formatting'
  },
  {
    name: 'Question Edge Cases',
    docxFile: 'edge-cases/Question Edge Cases.docx',
    jsonFile: 'edge-cases/Question Edge Cases.json',
    description: 'Tests edge cases specific to question parsing and detection'
  },
  {
    name: 'Structure Edge Cases',
    docxFile: 'edge-cases/Structure Edge Cases.docx',
    jsonFile: 'edge-cases/Structure Edge Cases.json',
    description: 'Tests document structure edge cases like empty sections'
  },
  {
    name: 'Expected Image Cases',
    docxFile: 'expected/Expected Image Cases.docx',
    jsonFile: 'expected/Expected Image Cases.json',
    description: 'Tests image handling and embedding in questions'
  },
  {
    name: 'Expected Question Cases',
    docxFile: 'expected/Expected Question Cases.docx',
    jsonFile: 'expected/Expected Question Cases.json',
    description: 'Tests standard question formats and structures'
  },
  {
    name: 'Expected Section Structuring - Begins with section',
    docxFile: 'expected/Expected Section Structuring - Begins with section.docx',
    jsonFile: 'expected/Expected Section Structuring - Begins with section.json',
    description: 'Tests documents that begin with section content'
  },
  {
    name: 'Expected Section Structuring',
    docxFile: 'expected/Expected Section Structuring.docx',
    jsonFile: 'expected/Expected Section Structuring.json',
    description: 'Tests standard section structuring and organization'
  },
  {
    name: 'Expected Test Cases - Images',
    docxFile: 'expected/Expected Test Cases -  Images.docx',
    jsonFile: 'expected/Expected Test Cases -  Images.json',
    description: 'Tests image handling in various contexts'
  },
  {
    name: 'Test Cover Page - Header Challenge Case',
    docxFile: 'expected/Test Cover Page - Header Challenge Case.docx',
    jsonFile: 'expected/Test Cover Page - Header Challenge Case.json',
    description: 'Tests complex document with headers, formatting, and font handling'
  }
];

/**
 * Deep comparison function that provides detailed diff information
 * @param {*} actual - The actual value
 * @param {*} expected - The expected value
 * @param {string} path - Current path in the object for error reporting
 * @returns {Array} Array of difference descriptions
 */
function deepCompare(actual, expected, path = '') {
  const differences = [];

  if (actual === expected) {
    return differences;
  }

  if (typeof actual !== typeof expected) {
    differences.push(`Type mismatch at ${path}: expected ${typeof expected}, got ${typeof actual}`);
    return differences;
  }

  if (actual === null || expected === null) {
    differences.push(`Null mismatch at ${path}: expected ${expected}, got ${actual}`);
    return differences;
  }

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      differences.push(`Array length mismatch at ${path}: expected ${expected.length}, got ${actual.length}`);
    }

    const maxLength = Math.max(actual.length, expected.length);
    for (let i = 0; i < maxLength; i++) {
      const currentPath = `${path}[${i}]`;
      if (i >= actual.length) {
        differences.push(`Missing element at ${currentPath}`);
      } else if (i >= expected.length) {
        differences.push(`Extra element at ${currentPath}`);
      } else {
        differences.push(...deepCompare(actual[i], expected[i], currentPath));
      }
    }
  } else if (typeof actual === 'object' && typeof expected === 'object') {
    const allKeys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in actual)) {
        differences.push(`Missing property at ${currentPath}`);
      } else if (!(key in expected)) {
        differences.push(`Extra property at ${currentPath}`);
      } else {
        differences.push(...deepCompare(actual[key], expected[key], currentPath));
      }
    }
  } else {
    differences.push(`Value mismatch at ${path}: expected "${expected}", got "${actual}"`);
  }

  return differences;
}

/**
 * Normalize data for comparison by removing volatile fields
 * @param {Object} data - The data to normalize
 * @returns {Object} Normalized data
 */
function normalizeForComparison(data) {
  const normalized = JSON.parse(JSON.stringify(data));
  
  // Remove mathRegistry as it contains generated IDs that may vary
  if (normalized.mathRegistry) {
    delete normalized.mathRegistry;
  }
  
  // Remove any timestamp or generated ID fields that might vary between runs
  function removeVolatileFields(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(removeVolatileFields);
    } else if (obj && typeof obj === 'object') {
      // Remove any fields that might contain generated IDs or timestamps
      Object.keys(obj).forEach(key => {
        if (key.includes('id') && typeof obj[key] === 'string' && obj[key].includes('math-')) {
          // Keep math placeholders but normalize the IDs for comparison
          obj[key] = obj[key].replace(/math-\d+/g, 'math-X');
        }
        removeVolatileFields(obj[key]);
      });
    }
  }
  
  removeVolatileFields(normalized);
  return normalized;
}

describe('DOCX Import Regression Tests', () => {
  // Test each fixture pair
  testCases.forEach(testCase => {
    describe(`${testCase.name}`, () => {
      let docxPath, jsonPath, expectedData;

      beforeAll(() => {
        docxPath = path.join(fixturesDir, testCase.docxFile);
        jsonPath = path.join(fixturesDir, testCase.jsonFile);

        // Verify files exist
        if (!fs.existsSync(docxPath)) {
          throw new Error(`DOCX fixture not found: ${docxPath}`);
        }
        if (!fs.existsSync(jsonPath)) {
          throw new Error(`JSON fixture not found: ${jsonPath}`);
        }

        // Load expected data
        expectedData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      });

      test(`should import ${testCase.name} consistently`, async () => {
        // Import the DOCX file
        const fileBuffer = fs.readFileSync(docxPath);
        const { dto, mathRegistry } = await parseDocx(fileBuffer);
        const actualData = { ...dto, mathRegistry };

        // Normalize both datasets for comparison
        const normalizedActual = normalizeForComparison(actualData);
        const normalizedExpected = normalizeForComparison(expectedData);

        // Perform deep comparison
        const differences = deepCompare(normalizedActual, normalizedExpected);

        if (differences.length > 0) {
          console.error(`\n❌ Regression detected in ${testCase.name}:`);
          console.error(`📝 Description: ${testCase.description}`);
          console.error(`🔍 Differences found (${differences.length}):`);
          differences.slice(0, 10).forEach((diff, index) => {
            console.error(`  ${index + 1}. ${diff}`);
          });
          if (differences.length > 10) {
            console.error(`  ... and ${differences.length - 10} more differences`);
          }
          console.error(`\n💡 To update fixture: npm run update-fixtures`);
        }

        // Assert no differences
        expect(differences).toHaveLength(0);
      }, 30000); // 30 second timeout for large files

      test(`should have consistent structure for ${testCase.name}`, () => {
        // Basic structure validation
        expect(expectedData).toHaveProperty('examBody');
        expect(Array.isArray(expectedData.examBody)).toBe(true);
        
        // Count questions and sections
        const questions = expectedData.examBody.filter(item => item.type === 'question');
        const sections = expectedData.examBody.filter(item => item.type === 'section');
        
        console.log(`📊 ${testCase.name} structure: ${expectedData.examBody.length} items (${questions.length} questions, ${sections.length} sections)`);
        
        // Validate each item has required properties
        expectedData.examBody.forEach((item, index) => {
          expect(item).toHaveProperty('type');
          expect(['question', 'section']).toContain(item.type);
          
          if (item.type === 'question') {
            expect(item).toHaveProperty('contentFormatted');
            expect(item).toHaveProperty('marks');
            expect(item).toHaveProperty('answers');
            expect(Array.isArray(item.answers)).toBe(true);
          } else if (item.type === 'section') {
            expect(item).toHaveProperty('contentFormatted');
          }
        });
      });

      test(`should preserve formatting in ${testCase.name}`, () => {
        // Check for preserved formatting elements
        const allContent = expectedData.examBody
          .map(item => item.contentFormatted || '')
          .join(' ');

        // Count formatting elements
        const boldCount = (allContent.match(/<strong>/g) || []).length;
        const italicCount = (allContent.match(/<em>/g) || []).length;
        const underlineCount = (allContent.match(/<u>/g) || []).length;
        const fontSpanCount = (allContent.match(/<span[^>]*font-family/g) || []).length;
        const mathCount = (allContent.match(/\[math:/g) || []).length;
        const imageCount = (allContent.match(/<img/g) || []).length;

        console.log(`🎨 ${testCase.name} formatting: ${boldCount} bold, ${italicCount} italic, ${underlineCount} underline, ${fontSpanCount} font spans, ${mathCount} math, ${imageCount} images`);

        // Basic formatting preservation checks
        if (testCase.name.includes('Font') || testCase.name.includes('Cover Page')) {
          expect(fontSpanCount).toBeGreaterThan(0);
        }
        
        if (testCase.name.includes('Image')) {
          expect(imageCount).toBeGreaterThan(0);
        }
      });
    });
  });

  // Summary test
  test('should have processed all expected test cases', () => {
    expect(testCases.length).toBeGreaterThan(0);
    console.log(`\n✅ Regression test suite covers ${testCases.length} test cases`);
    
    const totalQuestions = testCases.reduce((sum, testCase) => {
      const jsonPath = path.join(fixturesDir, testCase.jsonFile);
      if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        return sum + (data.examBody?.filter(item => item.type === 'question').length || 0);
      }
      return sum;
    }, 0);
    
    console.log(`📚 Total questions covered: ${totalQuestions}`);
  });
}); 