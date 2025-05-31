// client/docxDTO/utils/buildContentFormatted.js

import { extractPlainText } from './extractPlainText.js';
import { convertOmmlToLatex } from './ommlToLatex.js';

/**
 * Detect math elements in a paragraph
 * @param {Object} para - Paragraph object
 * @returns {Array} - Array of math elements
 */
export const detectMathElements = (para) => {
    const mathElements = [];

    if (!para) return mathElements;

    // Check for math at the paragraph level
    if (para['m:oMath']) {
        if (Array.isArray(para['m:oMath'])) {
            mathElements.push(...para['m:oMath']);
        } else {
            mathElements.push(para['m:oMath']);
        }
    }

    // Check for math in oMathPara
    if (para['m:oMathPara']) {
        if (Array.isArray(para['m:oMathPara'])) {
            para['m:oMathPara'].forEach(mathPara => {
                if (mathPara['m:oMath']) {
                    if (Array.isArray(mathPara['m:oMath'])) {
                        mathElements.push(...mathPara['m:oMath']);
                    } else {
                        mathElements.push(mathPara['m:oMath']);
                    }
                }
            });
        } else if (para['m:oMathPara']['m:oMath']) {
            if (Array.isArray(para['m:oMathPara']['m:oMath'])) {
                mathElements.push(...para['m:oMathPara']['m:oMath']);
            } else {
                mathElements.push(para['m:oMathPara']['m:oMath']);
            }
        }
    }

    return mathElements;
};

/**
 * Process math elements in content
 * @param {string} content - The text content with potential math placeholders
 * @param {Object} para - The paragraph object containing math elements
 * @returns {string} - Content with math elements processed
 */
function processMathElements(content, para) {
    // Get math elements
    const mathElements = detectMathElements(para);

    if (mathElements.length === 0) return content;

    console.log(`Found ${mathElements.length} math element(s)`);

    // Split content by line breaks
    const lines = content.split(/<br>/);

    // Try to match each math element with a numbered line (i., ii., etc.)
    for (let i = 0; i < mathElements.length && i < lines.length; i++) {
        const line = lines[i];
        // If line looks like "i.", "ii.", etc.
        if (/^(i{1,4}|iv|v|vi{1,3})\.\s*$/.test(line.trim())) {
            try {
                const latex = convertOmmlToLatex(mathElements[i]);
                if (latex) {
                    lines[i] = line.trim() + ` $${latex}$`;
                }
            } catch (error) {
                console.error(`Error converting math element ${i}:`, error);
            }
        }
        // Special case for lines with just a roman numeral followed by a dot
        else if (line.includes('i.') || line.includes('ii.') ||
            line.includes('iii.') || line.includes('iv.')) {
            // If we find a potential pattern anywhere in the line
            const match = line.match(/(i{1,4}|iv|v|vi{1,3})\./);
            if (match) {
                try {
                    const latex = convertOmmlToLatex(mathElements[i]);
                    if (latex) {
                        // Insert after the match
                        const pos = line.indexOf(match[0]) + match[0].length;
                        lines[i] = line.substring(0, pos) +
                            ` $${latex}$` +
                            line.substring(pos);
                    }
                } catch (error) {
                    console.error(`Error converting math element ${i}:`, error);
                }
            }
        }
    }

    // If there are unmatched math elements, append them at appropriate places
    if (mathElements.length > lines.length) {
        for (let i = lines.length; i < mathElements.length; i++) {
            try {
                const latex = convertOmmlToLatex(mathElements[i]);
                if (latex) {
                    // Append to the last line or create a new line
                    if (i < lines.length) {
                        lines[i] += ` $${latex}$`;
                    } else {
                        lines.push(`$${latex}$`);
                    }
                }
            } catch (error) {
                console.error(`Error converting math element ${i}:`, error);
            }
        }
    }

    // Reassemble content
    return lines.join('<br>');
}

/**
 * Build HTML formatted content from Word document runs, processing math elements as needed
 * @param {Array} runs - Array of Word document run elements
 * @param {Object} options - Processing options
 * @param {boolean} options.removeMarks - Whether to remove marks pattern
 * @param {Object} options.relationships - Document relationships
 * @param {Object} options.imageData - Image data mapping
 * @param {boolean} options.preserveMath - Whether to preserve math elements as LaTeX
 * @returns {string} Formatted content string
 */
export const buildContentFormatted = (runs, options = {}, parentPara = null) => {
    const {
        removeMarks = false,
        relationships = {},
        imageData = {},
        preserveMath = true // Default to true
    } = options;

    // Get the plain text content using the extractPlainText utility
    let content = extractPlainText(runs, { relationships, imageData });

    // Remove marks pattern if requested
    if (removeMarks) {
        content = content.replace(/^\[\s*\d+(?:\.\d+)?\s*marks?\s*\]\s*/i, '');
    }

    // Process math elements if present and preservation is requested
    if (parentPara && preserveMath) {
        content = processMathElements(content, parentPara);
    }

    // Process multiple br tags to preserve spacing
    content = content.replace(/<br>/g, '<br>');

    return content;
};