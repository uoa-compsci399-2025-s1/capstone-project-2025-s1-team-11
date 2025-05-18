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
        preserveMath = true // Changed default to true
    } = options;

    // First, get the plain text content
    let content = extractPlainText(runs, { relationships, imageData });

    // Remove marks pattern if requested
    if (removeMarks) {
        content = content.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');
    }

    // Check if parent paragraph has math
    if (parentPara && preserveMath) {
        // Get math elements
        const mathElements = detectMathElements(parentPara);

        if (mathElements.length > 0) {
            console.log(`Found ${mathElements.length} math element(s)`);

            // Find appropriate places to insert each math element
            // This is a common pattern in Word documents with Boolean algebra expressions:
            // i. [Formula 1]
            // ii. [Formula 2]
            // etc.

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
            content = lines.join('<br>');
        }
    }

    // Process multiple br tags to preserve spacing
    content = content.replace(/<br>/g, '<br>');

    return content;
};

/**
 * Extract plain text with math placeholders for later processing
 * @param {Array} runs - Array of Word document run elements
 * @param {Object} options - Processing options
 * @returns {Object} Object containing text with placeholders and math elements
 */
const extractPlainTextWithMathPlaceholders = (runs, options = {}) => {
    if (!Array.isArray(runs)) return { textWithPlaceholders: '', mathElems: [] };

    const { relationships = {}, imageData = {} } = options;
    const mathElements = [];
    let mathCounter = 0;

    // First, scan for math elements and collect them
    runs.forEach(run => {
        if (run && (run['m:oMath'] || run['m:oMathPara'])) {
            // Store the math element for later processing
            mathElements.push(run['m:oMath'] || run['m:oMathPara']);
        }
    });

    // Now process text content with placeholders for math
    let result = '';
    let lastRunEndedWithSpace = false;
    let lastRunWasLineBreak = false;
    let lastRunWasSingleChar = false;

    for (let i = 0; i < runs.length; i++) {
        const r = runs[i];
        if (!r) continue;

        // Check for math elements
        if (r['m:oMath'] || r['m:oMathPara']) {
            result += `[MATH_${mathCounter++}]`;
            lastRunEndedWithSpace = false;
            lastRunWasLineBreak = false;
            lastRunWasSingleChar = false;
            continue;
        }

        // Check for text formatting
        let isBold = false;
        let isItalic = false;
        let isUnderline = false;
        let isSubscript = false;
        let isSuperscript = false;
        let isMonospace = false;

        if (r['w:rPr']) {
            if (r['w:rPr']['w:b'] !== undefined) isBold = true;
            if (r['w:rPr']['w:i'] !== undefined) isItalic = true;
            if (r['w:rPr']['w:u'] !== undefined) isUnderline = true;

            if (r['w:rPr']['w:vertAlign']) {
                const vertAlign = r['w:rPr']['w:vertAlign'];
                const val = vertAlign['@_w:val'] || vertAlign['w:val'] || vertAlign?.['$']?.['w:val'];
                if (val === 'subscript') isSubscript = true;
                else if (val === 'superscript') isSuperscript = true;
            }

            if (r['w:rPr']['w:rFonts']) {
                const fontInfo = r['w:rPr']['w:rFonts'];
                const fontAscii = fontInfo['@_w:ascii'] || fontInfo?.['$']?.['w:ascii'];
                const fontHAnsi = fontInfo['@_w:hAnsi'] || fontInfo?.['$']?.['w:hAnsi'];
                const monospaceFonts = ['consolas', 'courier', 'courier new', 'lucida console', 'monaco', 'monospace', 'fixedsys', 'terminal'];
                const asciiLower = fontAscii?.toLowerCase() || '';
                const hAnsiLower = fontHAnsi?.toLowerCase() || '';
                if (monospaceFonts.some(f => asciiLower.includes(f) || hAnsiLower.includes(f))) {
                    isMonospace = true;
                }
            }
        }

        // Handle line breaks
        if (r['w:br'] !== undefined) {
            result += '<br>';
            lastRunEndedWithSpace = false;
            lastRunWasLineBreak = true;

            if (r['w:t'] === undefined) {
                continue;
            }
        }

        // Handle images
        if (r['w:drawing']) {
            const inline = r['w:drawing']['wp:inline'];
            const anchor = r['w:drawing']['wp:anchor'];

            let embedId = null;

            if (inline) {
                const blip = inline?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
                embedId = blip?.['@_r:embed'];
            }

            if (!embedId && anchor) {
                const blip = anchor?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
                embedId = blip?.['@_r:embed'];
            }

            if (embedId && imageData[embedId]) {
                const imgData = imageData[embedId];
                const width = imgData.width ? ` width="${Math.round(imgData.width)}"` : '';
                const height = imgData.height ? ` height="${Math.round(imgData.height)}"` : '';
                const alt = imgData.filename || 'Image';
                result += `<img alt="${alt}" src="${imgData.dataUrl}"${width}${height}>`;
            } else {
                const alt = "Image";
                result += `<img alt="${alt}" src="[Image Placeholder]">`;
            }

            lastRunWasLineBreak = false;
            lastRunWasSingleChar = false;
            continue;
        }

        // Extract text content
        let textContent = '';
        const t = r['w:t'];

        if (typeof t === 'string') {
            textContent = t;
        } else if (typeof t === 'number') {
            textContent = String(t);
        } else if (typeof t === 'object' && t) {
            if (t['#text']) {
                textContent = t['#text'];
            } else if (Object.keys(t).length === 0) {
                textContent = '';
            } else {
                textContent = '';
            }
        }

        if (textContent === undefined || textContent === null) {
            continue;
        }

        // Handle spacing
        const punctuationStart = /^[.,:;!?)]/.test(textContent);
        const currentIsSingleWordChar = textContent.length === 1 && /\w/.test(textContent);

        if (!lastRunWasLineBreak && !lastRunEndedWithSpace && result.length > 0 &&
            !result.endsWith(' ') && !result.endsWith('<br>') &&
            !textContent.startsWith(' ') && !punctuationStart) {

            const lastChar = result[result.length - 1];
            const isLastCharWordChar = /\w/.test(lastChar);
            const isFirstCharWordChar = /^\w/.test(textContent);

            if (!(lastRunWasSingleChar && isLastCharWordChar && isFirstCharWordChar)) {
                result += ' ';
            }
        }

        // Apply formatting
        if (isSubscript) textContent = `<sub>${textContent}</sub>`;
        else if (isSuperscript) textContent = `<sup>${textContent}</sup>`;
        if (isBold) textContent = `<strong>${textContent}</strong>`;
        if (isItalic) textContent = `<em>${textContent}</em>`;
        if (isUnderline) textContent = `<u>${textContent}</u>`;
        if (isMonospace) textContent = `<code>${textContent}</code>`;

        result += textContent;

        lastRunEndedWithSpace = textContent.endsWith(' ');
        lastRunWasLineBreak = false;
        lastRunWasSingleChar = currentIsSingleWordChar;
    }

    // Post-cleaning
    result = result.replace(/(\w+)~(\d+)~/g, '$1<sub>$2</sub>');
    result = result.replace(/(\w+)\^(\d+)\^/g, '$1<sup>$2</sup>');
    result = result.replace(/(\b[A-F0-9]+)(\d{1,2})\.(?=\s|<br>|$)/g, '$1<sub>$2</sub>.');
    result = result.replace(/(\w+)\s+<(sub|sup)>(\w+)<\/(sub|sup)>/g, '$1<$2>$3</$4>');

    return {
        textWithPlaceholders: result.trim(),
        mathElems: mathElements
    };
};