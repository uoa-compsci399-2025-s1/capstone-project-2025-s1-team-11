// src/services/docxExport/modules/contentProcessors/extractors/semesterExtractor.js

/**
 * Semester information extractor
 * Specialized module for extracting semester and year information from document content
 */

import { normalizeSemester } from '../utils/formatters.js';

/**
 * Extract semester and year using pattern matching
 * @param {string} fullText - Full text content
 * @param {Array} textLines - Array of text lines
 * @returns {Object} Extracted semester and year
 */
export function extractSemesterAndYear(fullText, textLines) {
    console.log("📅 Starting semester extraction with text:", fullText.substring(0, 200));

    console.log("📅 Text lines to check:");
    textLines.forEach((line, i) => {
        if (line.includes("Semester") || /\d{4}/.test(line)) {
            console.log(`Line ${i}: "${line}" <-- POTENTIAL MATCH`);
        } else {
            console.log(`Line ${i}: "${line}"`);
        }
    });


    const result = { semester: '', year: '' };

    // Try standard semester format first
    const semesterMatch = fullText.match(/Semester\s+([^,]+),\s+(\d{4})/i);
    if (semesterMatch) {
        result.semester = normalizeSemester(semesterMatch[1].trim());
        result.year = semesterMatch[2].trim();
        return result;
    }

    // Try other formats
    const patterns = [
        // Sem 1, 2024
        { regex: /Sem\.?\s+([^,]+),\s+(\d{4})/i, semesterIndex: 1, yearIndex: 2 },
        // S1 2024
        { regex: /S(1|2|3)\s+(\d{4})/i, semesterIndex: 1, yearIndex: 2 },
        // Summer School 2024
        { regex: /Summer\s+School\s+(\d{4})/i, semesterValue: 'Summer School', yearIndex: 1 },
    ];

    // Try each pattern in the full text
    for (const pattern of patterns) {
        const match = fullText.match(pattern.regex);
        if (match) {
            if (pattern.semesterValue) {
                result.semester = pattern.semesterValue;
            } else if (pattern.semesterIndex) {
                result.semester = normalizeSemester(match[pattern.semesterIndex].trim());
            }

            if (pattern.yearIndex) {
                result.year = match[pattern.yearIndex].trim();
            }

            return result;
        }
    }

    // Look for year and semester in separate lines if still not found
    for (const line of textLines) {
        // Check for year
        if (!result.year) {
            const yearMatch = line.match(/(\d{4})/);
            if (yearMatch) {
                result.year = yearMatch[1];
            }
        }

        // Check for semester indicators
        if (!result.semester) {
            if (line.match(/semester\s+(one|1|two|2|three|3)/i)) {
                const semMatch = line.match(/semester\s+(one|1|two|2|three|3)/i);
                if (semMatch) {
                    result.semester = normalizeSemester(semMatch[1]);
                }
            } else if (line.match(/summer\s+school/i)) {
                result.semester = 'Summer School';
            }
        }

        // If we found both, we can stop
        if (result.year && result.semester) {
            break;
        }
    }
    console.log("📅 Extracted semester info:", JSON.stringify(result));
    return result;
}