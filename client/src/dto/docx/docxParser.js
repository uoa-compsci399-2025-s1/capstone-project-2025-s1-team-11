// docxParser.js
import { extractDocumentXml } from './utils/extractDocumentXml.js';
import { parseXmlToJson } from './utils/parseXmlToJson.js';
import { transformXmlToDto } from './transformXmlToDto.js';

/**
 * Parses a DOCX file and returns a structured data transfer object
 * @param {string} file - Path to the DOCX file
 * @returns {Promise<Object>} The parsed document structure
 */
export async function parseDocx(file) {
    try {
        // Extract document content
        const { documentXml, relationships, imageData } = await extractDocumentXml(file);

        // Parse XML to JSON
        const parsedXml = parseXmlToJson(documentXml);

        // Transform to DTO structure
        const dto = transformXmlToDto(parsedXml, relationships, imageData);

        return dto;
    } catch (error) {
        console.error('Error parsing DOCX file:', error);
        throw error;
    }
}