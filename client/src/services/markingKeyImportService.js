/**
 * Opens a file picker and reads a marking key from a CSV file.
 * Returns the file object.
 */
export async function importMarkingKeyFile() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        { 
          description: 'CSV Marking Key Files', 
          accept: { 'text/csv': ['.csv'] } 
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
 * Parse CSV marking key content into a structured object
 * Format: VersionID,QuestionID,MarkWeight,OptionSequences,Answer
 * 
 * @param {string} csvContent - Raw CSV content as a string
 * @returns {Object} Parsed marking key data
 */
export function parseMarkingKeyCSV(csvContent) {
  const lines = csvContent.trim().split(/\r?\n/);
  
  // Check if file is empty
  if (lines.length <= 1) {
    throw new Error("CSV file does not contain data rows");
  }

  // Parse header to verify expected format
  const header = lines[0].split(',');
  const expectedHeader = ['VersionID', 'QuestionID', 'MarkWeight', 'OptionSequences', 'Answer'];
  
  if (!header.every((col, index) => col.trim() === expectedHeader[index])) {
    console.warn("CSV header format unexpected, proceeding with caution");
  }
  
  // Organize data by versions
  const versions = new Set();
  const questionData = {};
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    
    if (row.length < 5) {
      console.warn(`Skipping invalid row: ${lines[i]}`);
      continue;
    }
    
    const versionId = row[0].trim();
    const questionId = row[1].trim();
    const markWeight = parseFloat(row[2].trim());
    const optionSequence = row[3].trim();
    const answer = parseInt(row[4].trim(), 10);
    
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
 * Converts the option sequence string to an answer shuffle map
 * 
 * @param {string} optionSequence - A string representing the shuffled order (e.g., "10423")
 * @returns {Array} - The shuffle map where map[originalIndex] = newIndex
 */
export function createShuffleMapFromSequence(optionSequence) {
  // Create initial inverse shuffle map (newIndex → originalIndex)
  const inverseMap = optionSequence.split('').map(c => parseInt(c, 10));
  
  // Convert to our format (originalIndex → newIndex)
  const shuffleMap = new Array(inverseMap.length).fill(0);
  
  for (let newIndex = 0; newIndex < inverseMap.length; newIndex++) {
    const originalIndex = inverseMap[newIndex];
    shuffleMap[originalIndex] = newIndex;
  }
  
  return shuffleMap;
}

/**
 * Converts the answer bitmask to an array of correct answer indices
 * 
 * @param {number} answerMask - Bitmask representing correct answers (e.g., 5 = 1 + 4 = answers[0] and answers[2])
 * @param {number} optionCount - Number of options available
 * @returns {Array} - Array of indices for correct answers
 */
export function getCorrectAnswerIndices(answerMask, optionCount) {
  const correctIndices = [];
  
  for (let i = 0; i < optionCount; i++) {
    const bitValue = 1 << i;
    if ((answerMask & bitValue) !== 0) {
      correctIndices.push(i);
    }
  }
  
  return correctIndices;
}

/**
 * Process a CSV marking key file and generate the data needed to update Redux
 * 
 * @param {File} file - CSV file object
 * @returns {Promise<Object>} Object with versions, questionMappings, and markWeights
 */
export async function processMarkingKeyFile(file) {
  try {
    const content = await file.text();
    const parsedData = parseMarkingKeyCSV(content);
    
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