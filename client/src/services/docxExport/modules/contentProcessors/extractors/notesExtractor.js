// src/services/docxExport/modules/contentProcessors/extractors/notesExtractor.js

/**
 * Notes section extractor
 * Specialized module for extracting notes information from document content
 */

/**
 * Extract notes section
 * @param {Array} textLines - Array of text lines from document
 * @returns {string} Notes section text
 */
export function extractNoteSection(textLines) {
    let noteIndex = -1;
    for (let i = 0; i < textLines.length; i++) {
        if (textLines[i].match(/^NOTE:/i)) {
            noteIndex = i;
            break;
        }
    }

    if (noteIndex >= 0) {
        // Collect all lines from NOTE: to the end or until a clear delimiter
        const noteLines = [];
        for (let i = noteIndex; i < textLines.length; i++) {
            if (i === noteIndex) {
                // Include "NOTE:" in the first line
                noteLines.push(textLines[i]);
            } else {
                // For subsequent lines, check if we've reached a delimiter
                if (textLines[i].match(/^APPENDIX/i) ||
                    textLines[i].match(/^Question 1/i)) {
                    break;
                }
                noteLines.push(textLines[i]);
            }
        }
        return noteLines.join('\n');
    }

    return '';
}