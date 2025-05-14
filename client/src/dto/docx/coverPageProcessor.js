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
    const coverPageBlocks = [];
    const appendixBlocks = [];
    let foundFirstPageBreak = false;

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (!foundFirstPageBreak && hasPageBreak(block)) {
            foundFirstPageBreak = true;
            continue;
        }
        if (!foundFirstPageBreak) coverPageBlocks.push(block);
        else appendixBlocks.push(block);
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
    console.log("🧩 Processing blocks to HTML:", blocks);
    if (!blocks || blocks.length === 0) return '';
    const htmlParts = [];

    for (const block of blocks) {
        if (block['w:p']) {
            const runs = extractRuns(block['w:p']);
            console.log("📦 Extracted runs:", runs);  // ← Add this line
            const content = buildContentFormatted(runs, { relationships, imageData });
            if (content.trim()) htmlParts.push(`<p>${content}</p>`);
        } else if (block['w:tbl']) {
            htmlParts.push('<table border="1" style="border-collapse: collapse; width: 100%;">');
            const rows = Array.isArray(block['w:tbl']['w:tr']) ? block['w:tbl']['w:tr'] : [block['w:tbl']['w:tr']];
            for (const row of rows) {
                htmlParts.push('<tr>');
                const cells = Array.isArray(row['w:tc']) ? row['w:tc'] : [row['w:tc']];
                for (const cell of cells) {
                    htmlParts.push('<td>');
                    const paragraphs = Array.isArray(cell['w:p']) ? cell['w:p'] : [cell['w:p']];
                    for (const p of paragraphs) {
                        const runs = extractRuns(p);
                        const content = buildContentFormatted(runs, { relationships, imageData });
                        if (content.trim()) htmlParts.push(content);
                    }
                    htmlParts.push('</td>');
                }
                htmlParts.push('</tr>');
            }
            htmlParts.push('</table>');
        }
    }

    return htmlParts.join('\n');
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

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const text = doc.body.textContent;

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