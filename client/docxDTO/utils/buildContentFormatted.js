// client/docxDTO/utils/buildContentFormatted.js

import { extractPlainText } from './extractPlainText.js';
import { convertOmmlToMathML } from './ommlToMathML.js';

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

    // Check if any run contains equations
    const containsEquation = runs.some(run => run && (run['m:oMath'] || run['m:oMathPara']));

    let text;
    if (containsEquation) {
        // Extract equation from the runs
        const equationRun = runs.find(run => run && (run['m:oMath'] || run['m:oMathPara']));
        text = convertOmmlToMathML(equationRun);
    } else {
        text = extractPlainText(runs, relationships);
    }

    if (removeMarks) {
        text = text.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');
    }

    // Add newline after every <br>
    text = text.replace(/<br>/g, '<br>\n');

    return text.trim();
};
