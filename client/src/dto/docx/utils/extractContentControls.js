// src/dto/docx/utils/docxContentControlFinder.js

/**
 * Extract content controls from DOCX XML structure
 * @param {Object} parsedXml - Parsed XML from DOCX file
 * @returns {Object} Extracted content controls with their tags and values
 */
export function extractContentControls(parsedXml) {
    const contentControls = {};

    if (!parsedXml || !parsedXml['w:document'] || !parsedXml['w:document']['w:body']) {
        return contentControls;
    }

    // Get document body
    const body = parsedXml['w:document']['w:body'];

    // Process all paragraphs to find content controls
    const paragraphs = body['w:p'];
    if (!paragraphs) return contentControls;

    const paragraphArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs];

    // Process each paragraph to find content controls
    paragraphArray.forEach(paragraph => {
        processNodeForContentControls(paragraph, contentControls);
    });

    // Also check tables if present
    const tables = body['w:tbl'];
    if (tables) {
        const tableArray = Array.isArray(tables) ? tables : [tables];
        tableArray.forEach(table => {
            // Process rows
            const rows = table['w:tr'];
            if (rows) {
                const rowArray = Array.isArray(rows) ? rows : [rows];
                rowArray.forEach(row => {
                    // Process cells
                    const cells = row['w:tc'];
                    if (cells) {
                        const cellArray = Array.isArray(cells) ? cells : [cells];
                        cellArray.forEach(cell => {
                            // Process paragraphs in cells
                            const cellParagraphs = cell['w:p'];
                            if (cellParagraphs) {
                                const cellParagraphArray = Array.isArray(cellParagraphs) ? cellParagraphs : [cellParagraphs];
                                cellParagraphArray.forEach(cellParagraph => {
                                    processNodeForContentControls(cellParagraph, contentControls);
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    return contentControls;
}

/**
 * Process a node to extract content controls
 * @param {Object} node - XML node
 * @param {Object} contentControls - Object to store found content controls
 */
function processNodeForContentControls(node, contentControls) {
    // Check for structured document tag (SDT) which is how Word implements content controls
    if (node['w:sdt']) {
        const sdt = node['w:sdt'];

        // Extract the tag/title of the content control from properties
        if (sdt['w:sdtPr'] && sdt['w:sdtPr']['w:alias']) {
            const alias = sdt['w:sdtPr']['w:alias']['@_w:val'];

            // Extract the content of the control
            let contentText = '';

            // Content is usually in w:sdtContent -> w:r -> w:t
            if (sdt['w:sdtContent']) {
                contentText = extractTextFromNode(sdt['w:sdtContent']);
            }

            // Map common tag names to standardized keys
            const key = mapTagToKey(alias);
            if (key) {
                contentControls[key] = contentText;
            }
        }
    }

    // Recursively check runs (text runs) within the paragraph
    if (node['w:r']) {
        const runs = Array.isArray(node['w:r']) ? node['w:r'] : [node['w:r']];
        runs.forEach(run => {
            processNodeForContentControls(run, contentControls);
        });
    }

    // Process any other nested content controls
    for (const key in node) {
        if (typeof node[key] === 'object' && node[key] !== null) {
            // Avoid recursive calls on already processed nodes
            if (key !== 'w:r' && key !== 'w:sdt') {
                processNodeForContentControls(node[key], contentControls);
            }
        }
    }
}

/**
 * Extract text content from a node
 * @param {Object} node - XML node
 * @returns {string} Extracted text
 */
function extractTextFromNode(node) {
    if (!node) return '';

    let text = '';

    // If node has direct text
    if (node['w:t']) {
        const textContent = node['w:t'];
        if (typeof textContent === 'string') {
            text += textContent;
        } else if (textContent['#text']) {
            text += textContent['#text'];
        }
    }

    // Check for paragraph runs
    if (node['w:p']) {
        const paragraphs = Array.isArray(node['w:p']) ? node['w:p'] : [node['w:p']];
        paragraphs.forEach(p => {
            text += extractTextFromNode(p) + '\n';
        });
    }

    // Check for text runs
    if (node['w:r']) {
        const runs = Array.isArray(node['w:r']) ? node['w:r'] : [node['w:r']];
        runs.forEach(run => {
            if (run['w:t']) {
                const runText = run['w:t'];
                if (typeof runText === 'string') {
                    text += runText;
                } else if (runText['#text']) {
                    text += runText['#text'];
                }
            }
        });
    }

    // Process all other properties that might contain text
    for (const key in node) {
        if (typeof node[key] === 'object' && node[key] !== null) {
            // Avoid recursive calls on already processed nodes
            if (key !== 'w:t' && key !== 'w:p' && key !== 'w:r') {
                text += extractTextFromNode(node[key]);
            }
        }
    }

    return text.trim();
}

/**
 * Map content control tags to standardized keys
 * @param {string} tag - Original tag/alias from the content control
 * @returns {string|null} Standardized key or null if not mappable
 */
function mapTagToKey(tag) {
    if (!tag) return null;

    const tagLower = tag.toLowerCase().trim();

    // Map for common tag variations
    const tagMap = {
        // Term Description
        'term description': 'termDescription',
        'termdescription': 'termDescription',
        'term': 'termDescription',
        'semester': 'termDescription',

        // Campus
        'taught campus(es)': 'taughtCampus',
        'taughtcampus': 'taughtCampus',
        'taught campuses': 'taughtCampus',
        'campus': 'taughtCampus',

        // Long Subject
        'long subject': 'longSubject',
        'longsubject': 'longSubject',
        'subject': 'longSubject',

        // Full Course Title
        'full course title': 'fullCourseTitle',
        'fullcoursetitle': 'fullCourseTitle',
        'course title': 'fullCourseTitle',
        'coursetitle': 'fullCourseTitle',

        // Exam Duration
        'exam duration': 'examDuration',
        'examduration': 'examDuration',
        'time allowed': 'examDuration',
        'timeallowed': 'examDuration',
        'duration': 'examDuration'
    };

    // Return mapped key or null if not found
    return tagMap[tagLower] || null;
}