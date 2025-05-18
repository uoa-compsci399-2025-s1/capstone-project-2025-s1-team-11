// src/services/docxExport/modules/contentProcessors/extractors/courseInfoExtractor.js

/**
 * Course information extractor
 * Specialized module for extracting course code, number, and subject information
 */

/**
 * Extract course information
 * @param {string} fullText - Full text content
 * @param {Array} textLines - Array of text lines
 * @returns {Object} Extracted course information
 */
export function extractCourseInfo(fullText, textLines) {
    console.log("📚 Starting course info extraction with text:", fullText.substring(0, 200));

    console.log("📚 Text lines to check:");
    textLines.forEach((line, i) => {
        console.log(`Line ${i}: "${line}"`);
    });

    const result = {
        courseSubject: '',
        courseNumber: '',
        courseCode: '',
        subjectName: ''
    };

    // Extract course code and number
    const courseCodeMatch = fullText.match(/VERSION\s+\d+\s+([A-Z]+)\s+(\d+)/i) ||
        extractCourseCode(textLines);

    if (courseCodeMatch) {
        result.courseSubject = courseCodeMatch[1].trim();
        result.courseNumber = courseCodeMatch[2].trim();
        result.courseCode = `${result.courseSubject} ${result.courseNumber}`;
    }

    // Extract subject name
    result.subjectName = extractSubjectName(textLines);

    console.log("📚 Extracted course info:", JSON.stringify(result));
    return result;
}

/**
 * Extract course code and number using position-based approach
 * @param {Array} textLines - Array of text lines from document
 * @returns {Array|null} Match result with subject and number
 */
function extractCourseCode(textLines) {
    // Look for common patterns in first few lines
    for (let i = 0; i < Math.min(10, textLines.length); i++) {
        const line = textLines[i];

        // Try different patterns
        const patterns = [
            /([A-Z]{2,8})\s+(\d{3,4})/,  // COMPSCI 110
            /([A-Z]+)(\d{3,4})/,         // COMPSCI110
            /([A-Z]+)\s+(\d{3}[A-Z]?\d*)/  // For codes like MATH 101A
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return match;
            }
        }
    }

    return null;
}

/**
 * Extract subject name using formatting and position cues
 * @param {Array} textLines - Array of text lines from document
 * @returns {string} Subject name
 */
function extractSubjectName(textLines) {
    // Look for all caps text after campus line
    let campusIndex = -1;
    for (let i = 0; i < textLines.length; i++) {
        if (textLines[i].match(/Campus:/i)) {
            campusIndex = i;
            break;
        }
    }

    if (campusIndex >= 0 && campusIndex + 1 < textLines.length) {
        // Check next line for all caps subject name
        const nextLine = textLines[campusIndex + 1];
        if (nextLine === nextLine.toUpperCase() && nextLine.length > 3) {
            return nextLine.trim();
        }

        // If not found, look at next few lines
        for (let i = campusIndex + 1; i < Math.min(campusIndex + 4, textLines.length); i++) {
            const line = textLines[i];
            // Check if line is all uppercase and not too short
            if (line === line.toUpperCase() && line.length > 3 &&
                !line.includes('VERSION') && !line.includes('NOTE:')) {
                return line.trim();
            }
        }
    }

    // If not found after campus, look for all-caps lines near the beginning
    for (let i = 0; i < Math.min(10, textLines.length); i++) {
        const line = textLines[i];
        if (line === line.toUpperCase() && line.length > 3 &&
            !line.includes('UNIVERSITY') &&
            !line.includes('VERSION') &&
            !line.includes('NOTE:')) {
            return line.trim();
        }
    }

    return '';
}