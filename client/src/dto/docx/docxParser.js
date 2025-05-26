// docxParser.js
import { extractDocumentXml } from './utils/extractDocumentXml.js';
import { parseXmlToJson } from './utils/parseXmlToJson.js';
import { transformXmlToDto } from './transformXmlToDto.js';

/**
 * Parses a DOCX file and returns a structured data transfer object with math registry
 * @param {string} file - Path to the DOCX file
 * @returns {Promise<Object>} The parsed document structure and math registry
 */
export async function parseDocx(file) {
    try {
        // Extract document content
        const { documentXml, relationships, imageData } = await extractDocumentXml(file);

        // Parse XML to JSON
        const parsedXml = parseXmlToJson(documentXml);

        // Transform to DTO structure - ADD documentXml parameter
        const { dto, mathRegistry } = transformXmlToDto(parsedXml, relationships, imageData, documentXml);

        return { dto, mathRegistry };
    } catch (error) {
        console.error('Error parsing DOCX file:', error);
        throw error;
    }
}