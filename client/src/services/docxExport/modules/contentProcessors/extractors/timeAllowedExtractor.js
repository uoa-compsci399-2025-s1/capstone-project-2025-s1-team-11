// src/services/docxExport/modules/contentProcessors/extractors/timeAllowedExtractor.js

/**
 * Time allowed extractor
 * Specialized module for extracting time/duration information from document content
 */

/**
 * Extract time allowed information
 * @param {string} fullText - Full text content
 * @param {Array} textLines - Array of text lines
 * @returns {string} Time allowed text
 */
export function extractTimeAllowed(fullText, textLines) {
    // Look for time allowed pattern
    const timePatterns = [
        /\(Time\s+Allowed:\s*([^)]+)\)/i,
        /Time\s+Allowed:\s*([^()]+)/i,
        /\(\s*(\d+\.?\d*\s*hours?)\s*\)/i,
        /\(\s*(\d+\.?\d*\s*minutes?)\s*\)/i,
        /\(\s*(one|two|three|four)\s+hours?\s*\)/i,
        /\(\s*(one|two|three|four)\s+hours?\s*,?\s*(\d+)?\s*minutes?\s*\)/i,
    ];

    // Try each pattern in the full text
    for (const pattern of timePatterns) {
        const match = fullText.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    // Check for time indicators in individual lines
    for (const line of textLines) {
        if (line.match(/time allowed/i) || line.match(/duration/i)) {
            // Extract everything after "Time Allowed:" or "Duration:"
            const timeMatch = line.match(/(?:time allowed|duration)(?::\s*|\s+)(.+)/i);
            if (timeMatch) {
                return timeMatch[1].trim();
            }
        }

        // Look for time in parentheses
        if (line.match(/\([^)]*(?:hour|minute|min)[^)]*\)/i)) {
            const timeMatch = line.match(/\(([^)]*(?:hour|minute|min)[^)]*)\)/i);
            if (timeMatch) {
                return timeMatch[1].trim();
            }
        }
    }

    return '';
}