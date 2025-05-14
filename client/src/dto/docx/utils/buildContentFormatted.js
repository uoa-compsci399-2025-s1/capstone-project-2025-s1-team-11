// client/docxDTO/utils/buildContentFormatted.js

import { extractPlainText } from './extractPlainText.js';

/**
 * Build HTML formatted content from Word document runs, processing math elements as needed
 * @param {Array} runs - Array of Word document run elements
 * @param {Object} options - Processing options
 * @param {boolean} options.removeMarks - Whether to remove marks pattern
 * @param {Object} options.relationships - Document relationships
 * @param {Object} options.imageData - Image data mapping
 * @param {boolean} options.preserveMath - Whether to preserve math elements as placeholders
 * @returns {string} Formatted content string
 */
export const buildContentFormatted = (runs, options = {}) => {
    const { removeMarks = false, relationships = {}, imageData = {}, preserveMath = false } = options;

    // Extract text content, handling math elements
    let content = '';
    let mathCounter = 0;

    if (preserveMath) {
        // When preserving math, we need to process runs differently
        content = extractPlainTextWithMathPlaceholders(runs, { relationships, imageData }, mathCounter);
    } else {
        content = extractPlainText(runs, { relationships, imageData });
    }

    // Remove marks pattern if requested
    if (removeMarks) {
        content = content.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');
    }

    // Process multiple br tags to preserve spacing - preserve all <br> tags
    content = content.replace(/<br>/g, '<br>');

    return content;
};

/**
 * Extract plain text with math placeholders for later processing
 * @param {Array} runs - Array of Word document run elements
 * @param {Object} options - Processing options
 * @param {number} mathCounter - Counter for math placeholders
 * @returns {string} Text content with math placeholders
 */
const extractPlainTextWithMathPlaceholders = (runs, options = {}, mathCounter) => {
    if (!Array.isArray(runs)) return '';

    const { relationships = {}, imageData = {} } = options;

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

    return result.trim();
};