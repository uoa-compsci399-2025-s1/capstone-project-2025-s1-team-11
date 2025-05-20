import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { createImageModule, processTemplateData, postProcessDocxImages } from "../processors/imageProcessor.js";
import { formatExamDataForTemplate } from "../formatExamData.js";
import { postProcessTextFormatting } from "../processors/textProcessor.js";
import { insertPageBreaks } from "../processors/pageBreakProcessor.js";
import { loadTemplate, loadTemplateAlt } from "../loaders/templateLoader.js";

/**
 * Exports exam data to a DOCX file using Docxtemplater
 * @param {Object} examData - The exam data from Redux store
 * @param {ArrayBuffer} templateContent - The template file content as ArrayBuffer
 * @param {string|number} version - Version number to export
 * @returns {Promise<Blob>} - A blob containing the generated DOCX file
 */
export async function exportExamWithDocxtemplater(examData, templateContent, version) {
    try {
        if (!examData) {
            throw new Error("No exam data available for export");
        }

        if (!templateContent) {
            throw new Error("No template content provided");
        }

        if (templateContent.byteLength === 0) {
            throw new Error("Template content is empty");
        }

        // Create PizZip instance
        const zip = new PizZip(templateContent);

        // Create image module
        const imageModule = createImageModule();

        // Format the exam data for the template
        const formattedData = formatExamDataForTemplate(examData, version);

        // Process the formatted data to handle images
        const processedData = processTemplateData(formattedData);

        // Create and configure Docxtemplater - Updated for v4 API
        const doc = new Docxtemplater(zip, {
            modules: [imageModule],
            paragraphLoop: true,
            linebreaks: true,
            delimiters: {
                start: '{',
                end: '}'
            }
        });

        // Set the data
        doc.setData(processedData);

        // Render the document
        doc.render();

        // Get the zip file containing the generated document
        const generatedDocx = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compression: 'DEFLATE'
        });

        // Post-process to add images
        const processedWithImages = await postProcessDocxImages(generatedDocx, processedData);

        // Post-process to add text formatting
        const processedWithFormatting = await postProcessTextFormatting(processedWithImages);

        // Add page breaks
        const finalDocx = await insertPageBreaks(processedWithFormatting);

        return finalDocx;
    } catch (error) {
        console.error("Error in Docxtemplater export:", error);
        throw error;
    }
}

/**
 * Main export function that handles the entire process
 * @param {Object} examData - The exam data from Redux store
 * @param {string|number} version - Version number to export
 * @returns {Promise<Blob>} - A blob containing the generated DOCX file
 */
export async function exportExamToDocxWithDocxtemplater(examData, version = 1) {
    try {
        // Try loading with fetch first
        let templateContent;
        try {
            templateContent = await loadTemplate();
        } catch (fetchError) {
            console.error("Fetch failed, trying XHR:", fetchError);
            // If fetch fails, try XHR
            templateContent = await loadTemplateAlt();
        }

        if (!templateContent || templateContent.byteLength === 0) {
            throw new Error("Template content is empty");
        }

        // Process the template with exam data and version
        return await exportExamWithDocxtemplater(examData, templateContent, version);
    } catch (error) {
        console.error("Error in DOCX export process:", error);
        throw error;
    }
}