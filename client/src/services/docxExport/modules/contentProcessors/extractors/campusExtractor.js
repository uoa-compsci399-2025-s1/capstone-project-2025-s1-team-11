// src/services/docxExport/modules/contentProcessors/extractors/campusExtractor.js

/**
 * Campus information extractor
 * Specialized module for extracting campus information from document content
 */

/**
 * Extract campus information
 * @param {string} fullText - Full text content
 * @param {Array} textLines - Array of text lines
 * @returns {string} Extracted campus information
 */
export function extractCampus(fullText, textLines) {
    // Try standard campus format
    const campusMatch = fullText.match(/Campus:\s*([^\n]+)/i);
    if (campusMatch) {
        return campusMatch[1].trim();
    }

    // Look for campus mentions in text lines
    for (const line of textLines) {
        if (line.match(/campus/i)) {
            const lineMatch = line.match(/campus\s*:?\s*([^\n]+)/i);
            if (lineMatch) {
                return lineMatch[1].trim();
            }
        }
    }

    // Try to find common campus names
    const campusKeywords = ['City', 'Grafton', 'Epsom', 'Newmarket', 'Tai Tonga', 'Waipapa', 'Tamaki'];
    for (const line of textLines) {
        for (const campus of campusKeywords) {
            if (line.includes(campus)) {
                return campus;
            }
        }
    }

    return '';
}