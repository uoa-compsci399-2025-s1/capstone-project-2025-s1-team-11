// client/docxDTO/utils/buildContentFormatted.js

import { extractPlainText } from './extractPlainText.js';

/**
 * Build a clean contentFormatted string from paragraph runs.
 * Optionally remove [x mark/s] if it's a question.
 *
 * @param {Array} runs
 * @param {Object} options { removeMarks: boolean, relationships: object }
 * @returns {string}
 */
export const buildContentFormatted = (runs, options = {}) => {
    const { removeMarks = false, relationships = {} } = options;

    let text = extractPlainText(runs, relationships);

    if (removeMarks) {
        text = text.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');
    }

    // Add newline after every <br>
    text = text.replace(/<br>/g, '<br>\n');

    return text.trim();
};