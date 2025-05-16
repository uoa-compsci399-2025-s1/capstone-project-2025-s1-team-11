// client/src/dto/docx/coverPageProcessor.js

import { extractDocumentXml } from './utils/extractDocumentXml.js';
import { parseXmlToJson } from './utils/parseXmlToJson.js';
import { buildContentFormatted } from './utils/buildContentFormatted.js';

/**
 * Process a DOCX cover page file and extract metadata, cover page content, and appendix
 * @param {File} file - The DOCX file object
 * @returns {Promise<Object>} - Object containing metadata, cover page content, and appendix content
 */
export const processCoverPageFile = async (file) => {
    try {
        // Extract document content
        const { documentXml, relationships, imageData } = await extractDocumentXml(file);

        // Parse XML to JSON
        const parsedXml = parseXmlToJson(documentXml);

        // Process the document
        const body = parsedXml['w:document']?.['w:body'];
        if (!body) {
            throw new Error('Invalid document structure: missing document body');
        }

        // Extract all paragraphs and tables from the document
        const blocks = [
            ...(Array.isArray(body['w:p']) ? body['w:p'] : (body['w:p'] ? [body['w:p']] : [])),
            ...(Array.isArray(body['w:tbl']) ? body['w:tbl'] : (body['w:tbl'] ? [body['w:tbl']] : [])),
        ];

        console.log("🧱 Raw blocks extracted:", blocks);

        // Separate cover page and appendix
        const { coverPageBlocks, appendixBlocks } = separateCoverPageAndAppendix(blocks);

        console.log("📄 Cover page blocks:", coverPageBlocks);
        console.log("📎 Appendix blocks:", appendixBlocks);

        // Debug the structure of cover page blocks
        debugBlockStructure(coverPageBlocks);

        // Convert blocks to formatted HTML
        const coverPageContent = coverPageBlocks.length > 0
            ? processBlocksToHTML(coverPageBlocks, relationships, imageData)
            : null;

        const appendixContent = appendixBlocks.length > 0
            ? processBlocksToHTML(appendixBlocks, relationships, imageData)
            : null;

        console.log("📄 Extracted coverPageContent:", coverPageContent);
        console.log("📎 Extracted appendixContent:", appendixContent);

        // Extract metadata from cover page content
        const metadata = extractMetadata(coverPageContent || '');

        console.log("🧠 Extracted metadata:", metadata);

        return {
            metadata,
            coverPageContent,
            appendixContent
        };
    } catch (error) {
        console.error('❌ Error processing cover page file:', error);
        throw error;
    }
};

const separateCoverPageAndAppendix = (blocks) => {
    // In the parsed XML, paragraphs are the direct elements, not wrapped in 'w:p'
    const rawBlocks = [];

    // Check if blocks array contains wrapped or unwrapped paragraphs
    blocks.forEach(block => {
        if (block['w:p']) {
            // If wrapped, unwrap it
            rawBlocks.push(block['w:p']);
        } else {
            // Already unwrapped
            rawBlocks.push(block);
        }
    });

    const coverPageBlocks = [];
    const appendixBlocks = [];
    let foundFirstPageBreak = false;

    for (let i = 0; i < rawBlocks.length; i++) {
        const block = rawBlocks[i];
        if (!foundFirstPageBreak && hasPageBreak(block)) {
            foundFirstPageBreak = true;
            continue;
        }
        if (!foundFirstPageBreak) {
            coverPageBlocks.push(block);
        } else {
            appendixBlocks.push(block);
        }
    }

    return { coverPageBlocks, appendixBlocks };
};

const hasPageBreak = (block) => {
    if (block['w:sectPr']) return true;

    if (block['w:r']) {
        const runs = Array.isArray(block['w:r']) ? block['w:r'] : [block['w:r']];
        return runs.some(run => run['w:br'] && run['w:br']['@_w:type'] === 'page');
    }

    return false;
};

const extractRuns = (node) => {
    if (!node || typeof node !== 'object') return [];

    const runs = [];

    // Direct w:r node(s)
    if (node['w:r']) {
        const directRuns = Array.isArray(node['w:r']) ? node['w:r'] : [node['w:r']];
        runs.push(...directRuns);
    }

    // Explore children, ignoring formatting-only tags
    const ignoredKeys = new Set([
        'w:pPr', 'w:tblPr', 'w:tblGrid', 'w:trPr', 'w:tcPr', '_attr'
    ]);

    for (const key of Object.keys(node)) {
        if (!ignoredKeys.has(key) && typeof node[key] === 'object') {
            const child = node[key];
            if (Array.isArray(child)) {
                for (const item of child) {
                    runs.push(...extractRuns(item));
                }
            } else {
                runs.push(...extractRuns(child));
            }
        }
    }

    return runs;
};

const processBlocksToHTML = (blocks, relationships, imageData) => {
    console.log("🧩 Processing blocks to HTML:", blocks.length, "blocks");
    if (!blocks || blocks.length === 0) return '';
    const htmlParts = [];

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        console.log(`Block ${i}:`, Object.keys(block));

        // Check if this is a paragraph block (has 'w:p' wrapper) or direct paragraph content
        const isParagraphWrapper = block['w:p'] !== undefined;
        const isTableWrapper = block['w:tbl'] !== undefined;
        const isDirectParagraph = block['w:pPr'] !== undefined || block['w:r'] !== undefined;

        if (isParagraphWrapper || isDirectParagraph) {
            // Get the paragraph content - either from w:p wrapper or directly
            const paragraph = isParagraphWrapper ? block['w:p'] : block;
            let content = '';

            // Check if paragraph has runs
            if (paragraph['w:r']) {
                const runs = Array.isArray(paragraph['w:r']) ? paragraph['w:r'] : [paragraph['w:r']];
                console.log(`Paragraph ${i} has ${runs.length} runs`);
                content = buildContentFormatted(runs, { relationships, imageData });
                console.log(`Built content for paragraph ${i}:`, content.slice(0, 100));
            }
            // Check if paragraph has direct text
            else if (paragraph['w:t']) {
                console.log(`Paragraph ${i} has direct text`);
                content = paragraph['w:t'];
            }
            else {
                console.log(`Paragraph ${i} has no runs or direct text`);
                // Some paragraphs might be empty or contain only formatting
            }

            if (content && content.trim()) {
                htmlParts.push(`<p>${content}</p>`);
            }
        } else if (isTableWrapper) {
            console.log(`Block ${i} is a table`);
            const table = block['w:tbl'];
            htmlParts.push('<table border="1" style="border-collapse: collapse; width: 100%;">');

            const rows = table['w:tr'];
            if (!rows) {
                console.log("No rows found in table");
                htmlParts.push('</table>');
                continue;
            }

            const rowArray = Array.isArray(rows) ? rows : [rows];
            console.log(`Table has ${rowArray.length} rows`);

            for (const row of rowArray) {
                htmlParts.push('<tr>');
                const cells = row['w:tc'];

                if (!cells) {
                    htmlParts.push('</tr>');
                    continue;
                }

                const cellArray = Array.isArray(cells) ? cells : [cells];

                for (const cell of cellArray) {
                    htmlParts.push('<td>');
                    let cellContent = '';

                    // Try to extract text from cell
                    const paragraphs = cell['w:p'];
                    if (paragraphs) {
                        const paraArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs];

                        for (const p of paraArray) {
                            if (p['w:r']) {
                                const runs = Array.isArray(p['w:r']) ? p['w:r'] : [p['w:r']];
                                const content = buildContentFormatted(runs, { relationships, imageData });
                                if (content.trim()) cellContent += content + ' ';
                            } else if (p['w:t']) {
                                cellContent += p['w:t'] + ' ';
                            }
                        }
                    }

                    htmlParts.push(cellContent.trim());
                    htmlParts.push('</td>');
                }
                htmlParts.push('</tr>');
            }
            htmlParts.push('</table>');
        } else {
            console.log(`Block ${i} is unknown type:`, Object.keys(block).slice(0, 5));
        }
    }

    const result = htmlParts.join('\n');
    console.log("🏁 Final HTML length:", result.length);
    console.log("🏁 First 500 chars:", result.slice(0, 500));
    return result;
};

const extractMetadata = (content) => {
    const metadata = {
        examTitle: '',
        courseCode: '',
        courseName: '',
        semester: '',
        year: '',
        campus: '',
        timeAllowed: ''
    };

    if (!content) {
        console.log("No content to extract metadata from");
        return metadata;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const text = doc.body.textContent || '';

    const courseMatch = text.match(/([A-Z]+)\s+(\d+):\s+([^\n]+)/);
    if (courseMatch) {
        metadata.courseCode = `${courseMatch[1]} ${courseMatch[2]}`.trim();
        metadata.courseName = courseMatch[3].trim();
    }

    const titleMatch = text.match(/(Mid-Semester Test|Final Examination|Test|Examination)/i);
    if (titleMatch) metadata.examTitle = titleMatch[1].trim();

    const semesterMatch = text.match(/Semester\s+(\d+),\s+(\d{4})/i);
    if (semesterMatch) {
        metadata.semester = `Semester ${semesterMatch[1]}`.trim();
        metadata.year = semesterMatch[2].trim();
    }

    const campusMatch = text.match(/Campus:\s+([^*\n]+)/i);
    if (campusMatch) metadata.campus = campusMatch[1].trim();

    const timeMatch = text.match(/Time\s+Allowed:\s+([^)]+)/i);
    if (timeMatch) metadata.timeAllowed = timeMatch[1].trim();

    return metadata;
};

// Debug function to print block structure
const debugBlockStructure = (blocks) => {
    console.log("🔍 Debugging block structure:");
    for (let i = 0; i < Math.min(3, blocks.length); i++) {
        console.log(`Block ${i} full structure:`, JSON.stringify(blocks[i], null, 2));
    }
};

/**
 * Integration function for Redux - processes file and dispatches appropriate actions
 * @param {File} file - The DOCX file object
 * @param {Function} dispatch - Redux dispatch function
 */
export const processCoverPageForRedux = async (file, dispatch) => {
    try {
        const { metadata, coverPageContent, appendixContent } = await processCoverPageFile(file);

        console.log("📄 Extracted metadata:", metadata);
        console.log("📄 Extracted coverPageContent:", coverPageContent);
        console.log("📄 Extracted appendixContent:", appendixContent);

        // Update exam metadata with extracted information
        if (metadata) {
            if (metadata.examTitle) {
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'examTitle', value: metadata.examTitle }
                });
                console.log("✅ Dispatched examTitle");
            }

            if (metadata.courseCode) {
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'courseCode', value: metadata.courseCode }
                });
                console.log("✅ Dispatched courseCode");
            }

            if (metadata.courseName) {
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'courseName', value: metadata.courseName }
                });
                console.log("✅ Dispatched courseName");
            }

            if (metadata.semester) {
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'semester', value: metadata.semester }
                });
                console.log("✅ Dispatched semester");
            }

            if (metadata.year) {
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'year', value: metadata.year }
                });
                console.log("✅ Dispatched year");
            }

            const additionalMetadata = {
                campus: metadata.campus || '',
                timeAllowed: metadata.timeAllowed || ''
            };

            if (Object.values(additionalMetadata).some(value => value)) {
                dispatch({
                    type: 'exam/updateExamMetadata',
                    payload: additionalMetadata
                });
                console.log("✅ Dispatched additional metadata");
            }
        }

        // Dispatch the cover page content
        if (coverPageContent) {
            console.log("📄 Dispatching setCoverPage with contentFormatted:", coverPageContent);
            dispatch({
                type: 'exam/setCoverPage',
                payload: {
                    contentFormatted: coverPageContent,
                    format: 'HTML'
                }
            });
        } else {
            console.warn("⚠️ No coverPageContent to dispatch.");
        }

        if (appendixContent) {
            dispatch({
                type: 'exam/setAppendix',
                payload: {
                    contentFormatted: appendixContent,
                    format: 'HTML'
                }
            });
            console.log("📄 Dispatched appendixContent");
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error processing cover page for Redux:', error);
        return { success: false, error: error.message };
    }
};