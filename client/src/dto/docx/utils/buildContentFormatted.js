// client/docxDTO/utils/buildContentFormatted.js

import { extractPlainText } from './extractPlainText.js';

/**
 * Build a clean contentFormatted string from paragraph runs.
 * Optionally remove [x mark/s] if it's a question.
 *
 * @param {Array} runs
 * @param {Object} options { removeMarks: boolean, relationships: object, imageData: object }
 * @returns {string}
 */
export const buildContentFormatted = (runs, options = {}) => {
    const { removeMarks = false, relationships = {}, imageData = {} } = options;

    let text = extractPlainText(runs, { relationships, imageData });
    text = text.replace(/{{math_\d+}}/g, '<span class="math-placeholder">[math]</span>');
    text = text.replace(/§CODE§(.*?)§\/CODE§/gs, (_, code) => {
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
    });

    if (removeMarks) {
        text = text.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');
    }

    // Add newline after every <br>
    text = text.replace(/<br>/g, '<br>\n');

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    return text.trim();
};