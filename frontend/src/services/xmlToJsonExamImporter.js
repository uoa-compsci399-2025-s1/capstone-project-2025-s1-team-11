// src/services/xmlToJsonExamImporter.js

import { ExamXmlDTO } from "../dto/examXML.js";
import { convertExamXmlDTOToJson } from "../utilities/convertExamXmlToJson.js";

/**
 * Imports an exam from an XML file, converts it to a JSON model, and returns it via a callback.
 * @param {File} file - The uploaded XML file.
 * @param {Function} callback - Callback function(error, examJson)
 */
export function importExamFromXMLtoJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const xmlString = event.target.result;
            // Create the XML DTO from the file's XML content
            const examXmlDTO = ExamXmlDTO.fromXML(xmlString);
            // Convert the XML DTO to your JSON model
            const examJson = convertExamXmlDTOToJson(examXmlDTO);
            callback(null, examJson);
        } catch (error) {
            callback(error, null);
        }
    };
    reader.onerror = (error) => callback(error, null);
    reader.readAsText(file);
}