export function readTeleform(teleformData) {
  return teleformData
    .trim()
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(readTeleformLine);
}

/**
 * Parses a single line of teleform scan data into a student object
 * @param {String} line - A single line from the Teleform file
 * @returns {Object} Parsed student data
 */
export function readTeleformLine(line) {
  if (line.length < 45) {
    throw new Error("Teleform line too short to parse");
  }

  return {
    studentId: line.substring(2, 11),
    lastName: line.substring(12, 23).trim(),
    firstName: line.substring(23, 33).trim(),
    versionId: line.substring(35, 44),
    answerString: line.substring(45).trim()
  };
}