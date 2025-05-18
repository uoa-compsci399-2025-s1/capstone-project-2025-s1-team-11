// src/services/docxExport/modules/contentProcessors/extractors/examTitleExtractor.js

/**
 * Exam title extractor
 * Specialized module for extracting exam title from document content
 */

/**
 * Extract exam title using context clues
 * @param {Array} textLines - Array of text lines from document
 * @param {string} subjectName - Already extracted subject name
 * @returns {string} Exam title
 */
export function extractExamTitle(textLines, subjectName) {
    // Look for common exam title patterns
    const examTitlePatterns = [
        /mid-semester test/i,
        /final exam/i,
        /midterm/i,
        /test/i,
        /exam/i,
        /quiz/i
    ];

    // If we found the subject name, look for title after it
    if (subjectName) {
        const subjectIndex = textLines.findIndex(line =>
            line.trim() === subjectName.trim());

        if (subjectIndex >= 0 && subjectIndex + 1 < textLines.length) {
            // Check next few lines for title
            for (let i = subjectIndex + 1; i < Math.min(subjectIndex + 4, textLines.length); i++) {
                const line = textLines[i].trim();

                // Skip if line is too short or has common patterns to exclude
                if (line.length < 3 ||
                    line.includes('Time Allowed') ||
                    line.includes('NOTE:')) {
                    continue;
                }

                // Check if line matches common exam title patterns
                for (const pattern of examTitlePatterns) {
                    if (line.match(pattern)) {
                        return line;
                    }
                }

                // If line after course code/info and not all caps, likely the title
                if (line !== line.toUpperCase() &&
                    !line.match(/^COMPSCI \d{3}/i) &&
                    !line.match(/^[A-Z]+ \d{3}/i)) {
                    return line;
                }
            }
        }
    }

    // Look for lines that seem like titles in the whole document
    for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i].trim();

        // Skip if line is too short
        if (line.length < 3) continue;

        // Check against exam title patterns
        for (const pattern of examTitlePatterns) {
            if (line.match(pattern)) {
                return line;
            }
        }
    }

    return '';
}