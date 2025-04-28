// client/src/utilities/testUtils/loadFixtureWithName.js

import fs from 'fs';
import path from 'path';

// Base directory to search for fixtures
const baseDir = path.resolve('cypress', 'fixtures');

/**
 * Loads a test file buffer from cypress/fixtures/subfolder
 *
 * @param {string} subfolder - The folder inside cypress/fixtures (e.g. 'docx' or 'xml')
 * @param {string} filename - The name of the file (e.g. 'valid_exam_control.docx')
 * @returns {{ buffer: Buffer, filename: string }}
 */
export const loadFixtureWithName = (subfolder, filename) => {
    const filePath = path.join(baseDir, subfolder, filename);
    const buffer = fs.readFileSync(filePath);
    return { buffer, filename };
};