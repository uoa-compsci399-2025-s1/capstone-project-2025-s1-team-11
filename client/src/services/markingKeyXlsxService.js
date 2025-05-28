import * as XLSX from 'xlsx';

/**
 * Opens a file picker and reads a marking key from an XLSX file.
 * Returns the file object.
 */
export async function importMarkingKeyFile() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        { 
          description: 'Excel Marking Key Files', 
          accept: { 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
          } 
        }
      ],
      multiple: false,
    });

    const file = await fileHandle.getFile();
    return file;
  } catch (err) {
    console.error("File open cancelled or failed:", err);
    return null;
  }
}

/**
 * Parse XLSX marking key content into a structured object
 * Expected format: VersionID,QuestionID,MarkWeight,OptionSequences,Answer
 * 
 * @param {ArrayBuffer} xlsxContent - Raw XLSX content as ArrayBuffer
 * @returns {Object} Parsed marking key data
 */
export function parseMarkingKeyXLSX(xlsxContent) {
  // Read the XLSX file
  const workbook = XLSX.read(xlsxContent, { type: 'array' });
  
  // Get the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (rows.length <= 1) {
    throw new Error("XLSX file does not contain data rows");
  }

  // Verify header
  const header = rows[0];
  const expectedHeader = ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer'];
  
  if (!header.every((col, index) => col === expectedHeader[index])) {
    console.warn("XLSX header format unexpected, proceeding with caution");
  }

  // Organize data by versions
  const versions = new Set();
  const questionData = {};

  // Parse data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    if (row.length < 5) {
      console.warn(`Skipping invalid row: ${row}`);
      continue;
    }

    const versionId = String(row[0]);
    const questionId = String(row[1]);
    const markWeight = parseFloat(row[2]);
    const optionSequence = String(row[3]);
    const answer = parseInt(row[4], 10);

    // Track versions
    versions.add(versionId);

    // Initialize question if not exists
    if (!questionData[questionId]) {
      questionData[questionId] = {
        markWeight,
        versions: {}
      };
    }

    // Store data for this version
    questionData[questionId].versions[versionId] = {
      optionSequence,
      answer
    };
  }

  return {
    versions: Array.from(versions).sort(),
    questionData
  };
}

/**
 * Process an XLSX marking key file and generate the data needed to update Redux
 * 
 * @param {File} file - XLSX file object
 * @returns {Promise<Object>} Object with versions, questionMappings, and markWeights
 */
export async function processMarkingKeyFile(file) {
  try {
    const buffer = await file.arrayBuffer();
    const parsedData = parseMarkingKeyXLSX(buffer);
    
    const result = {
      versions: parsedData.versions,
      questionMappings: {},
      markWeights: {}
    };
    
    // Process each question
    Object.entries(parsedData.questionData).forEach(([questionNumber, data]) => {
      result.markWeights[questionNumber] = data.markWeight;
      result.questionMappings[questionNumber] = {};
      
      // Process each version for this question
      Object.entries(data.versions).forEach(([versionId, versionData]) => {
        const versionIndex = parsedData.versions.indexOf(versionId);
        
        if (versionIndex === -1) {
          console.warn(`Version ${versionId} not found in versions list`);
          return;
        }
        
        const shuffleMap = createShuffleMapFromSequence(versionData.optionSequence);
        const correctAnswerIndices = getCorrectAnswerIndices(versionData.answer, shuffleMap.length);
        
        // Store data for this question and version
        if (!result.questionMappings[questionNumber]) {
          result.questionMappings[questionNumber] = {};
        }
        
        result.questionMappings[questionNumber][versionId] = {
          shuffleMap,
          correctAnswerIndices
        };
      });
    });
    
    return result;
  } catch (error) {
    console.error("Error processing marking key file:", error);
    throw error;
  }
}

/**
 * Export marking key data to XLSX format
 * 
 * @param {Object} markingKeyData - The marking key data to export
 * @returns {Blob} XLSX file as a Blob
 */
export function exportMarkingKeyToXLSX(markingKeyData) {
  const rows = [
    ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer']
  ];

  // Create an array of all rows first so we can sort them
  const dataRows = [];

  // Convert marking key data to rows
  Object.entries(markingKeyData.questionMappings).forEach(([questionId, questionData]) => {
    const markWeight = markingKeyData.markWeights[questionId];

    Object.entries(questionData).forEach(([versionId, versionData]) => {
      // Convert shuffle map back to option sequence
      const optionSequence = versionData.shuffleMap
        .map((_, index) => versionData.shuffleMap.indexOf(index))
        .join('');

      // Convert correct answer indices back to bitmask
      const answer = versionData.correctAnswerIndices.reduce((acc, index) => acc | (1 << index), 0);

      dataRows.push([versionId, questionId, markWeight, optionSequence, answer]);
    });
  });

  // Sort rows by VersionID first, then by QuestionID
  dataRows.sort((a, b) => {
    // Compare VersionID first
    const versionCompare = a[0].localeCompare(b[0], undefined, { numeric: true });
    if (versionCompare !== 0) return versionCompare;
    
    // If VersionID is the same, compare QuestionID
    return parseInt(a[1]) - parseInt(b[1]);
  });

  // Add sorted rows to the final array
  rows.push(...dataRows);

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Marking Key");

  // Generate XLSX file
  const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Helper functions from the original service
function createShuffleMapFromSequence(optionSequence) {
  const inverseMap = optionSequence.split('').map(c => parseInt(c, 10));
  const shuffleMap = new Array(inverseMap.length).fill(0);
  
  for (let newIndex = 0; newIndex < inverseMap.length; newIndex++) {
    const originalIndex = inverseMap[newIndex];
    shuffleMap[originalIndex] = newIndex;
  }
  
  return shuffleMap;
}

function getCorrectAnswerIndices(answerMask, optionCount) {
  const correctIndices = [];
  
  for (let i = 0; i < optionCount; i++) {
    const bitValue = 1 << i;
    if ((answerMask & bitValue) !== 0) {
      correctIndices.push(i);
    }
  }
  
  return correctIndices;
} 