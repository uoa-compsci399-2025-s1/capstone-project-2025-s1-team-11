// client/src/services/docxExport/modules/contentProcessors/coverPageProcessor.js

/**
 * Cover Page Processor
 * Processes DOCX file to extract cover page content and metadata
 */

import { extractDocumentXml } from '../../../../dto/docx/utils/extractDocumentXml.js';
import { parseXmlToJson } from '../../../../dto/docx/utils/parseXmlToJson.js';
import { buildContentFormatted } from '../../../../dto/docx/utils/buildContentFormatted.js';
import { extractContentControls } from '../../../../dto/docx/utils/extractContentControls.js';
import { parseCoverPage, formatCoverPageForTemplate, parseAppendixForExport } from './coverPageParser.js';

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

        // Extract content controls from the document
        const contentControls = extractContentControls(parsedXml);
        console.log("🎛️ Extracted content controls:", contentControls);

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

        // Separate cover page and appendix
        const { coverPageBlocks, appendixBlocks } = separateCoverPageAndAppendix(blocks);

        // Convert blocks to formatted HTML
        const coverPageContent = coverPageBlocks.length > 0
            ? processBlocksToHTML(coverPageBlocks, relationships, imageData)
            : null;

        const appendixContent = appendixBlocks.length > 0
            ? processBlocksToHTML(appendixBlocks, relationships, imageData)
            : null;

        // Extract metadata from cover page content, passing content controls for more accurate extraction
        const parsedData = parseCoverPage(coverPageContent, contentControls);

        const metadata = {
            examTitle: parsedData.examTitle || '',
            courseCode: parsedData.courseCode || '',
            courseName: parsedData.subjectName || '',
            semester: parsedData.semester || '',
            year: parsedData.year || '',
            campus: parsedData.campus || '',
            timeAllowed: parsedData.timeAllowed || ''
        };

        console.log("🧠 Full parsed data:", parsedData);
        console.log("🧠 Mapped metadata:", metadata);

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

const processBlocksToHTML = (blocks, relationships, imageData) => {
    if (!blocks || blocks.length === 0) return '';
    const htmlParts = [];

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

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
                content = buildContentFormatted(runs, { relationships, imageData });
            }
            // Check if paragraph has direct text
            else if (paragraph['w:t']) {
                content = paragraph['w:t'];
            }

            if (content && content.trim()) {
                htmlParts.push(`<p>${content}</p>`);
            }
        } else if (isTableWrapper) {
            const table = block['w:tbl'];
            htmlParts.push('<table border="1" style="border-collapse: collapse; width: 100%;">');

            const rows = table['w:tr'];
            if (!rows) {
                htmlParts.push('</table>');
                continue;
            }

            const rowArray = Array.isArray(rows) ? rows : [rows];

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
        }
    }

    const result = htmlParts.join('\n');
    return result;
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
        console.log("📤 Metadata to dispatch:", JSON.stringify(metadata, null, 2));
        // Parse the content again to get notes section
        const parsedData = parseCoverPage(coverPageContent);

        // Update exam metadata with extracted information
        if (metadata) {
            if (metadata.examTitle) {
                console.log("📤 About to dispatch - examTitle:", metadata.examTitle);
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'examTitle', value: metadata.examTitle }
                });
            }

            if (metadata.courseCode) {
                console.log("📤 About to dispatch - courseCode:", metadata.courseCode);
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'courseCode', value: metadata.courseCode }
                });
            }

            if (metadata.courseName) {
                console.log("📤 About to dispatch - courseName:", metadata.courseName);
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'courseName', value: metadata.courseName }
                });
            }

            if (metadata.semester) {
                console.log("📤 About to dispatch - semester:", metadata.semester);
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'semester', value: metadata.semester }
                });
            }

            if (metadata.year) {
                console.log("📤 About to dispatch - year:", metadata.year);
                dispatch({
                    type: 'exam/updateExamField',
                    payload: { field: 'year', value: metadata.year }
                });
            }

            const additionalMetadata = {
                campus: metadata.campus || '',
                timeAllowed: metadata.timeAllowed || ''
            };

            if (parsedData.notes) {
                dispatch({
                    type: 'exam/updateExamMetadata',
                    payload: {
                        notes: parsedData.notes
                    }
                });
            }

            if (Object.values(additionalMetadata).some(value => value)) {
                dispatch({
                    type: 'exam/updateExamMetadata',
                    payload: additionalMetadata
                });
            }
        }

        // Dispatch the cover page content
        if (coverPageContent) {
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
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error processing cover page file:', error);
        return { success: false, error: error.message };
    }
};