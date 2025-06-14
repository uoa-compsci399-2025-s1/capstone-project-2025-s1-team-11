import { RELATIONSHIP_TYPES } from "../utils/docxConstants.js";

/**
 * Processes headers to replace placeholders with actual values
 * @param {Map} files - Map of all files in the DOCX
 * @param {Array} relationships - Array of relationship objects
 * @param {string} version - Version number (e.g., "1", "2", etc.)
 * @param {string} courseCode - Course code (e.g., "COMPSCI 110")
 */
export function processHeaders(files, relationships, version, courseCode) {
    // Find all header relationships
    const headerRels = relationships.filter(rel => 
        rel.type === RELATIONSHIP_TYPES.HEADER
    );
    
    headerRels.forEach(rel => {
        const filePath = `word/${rel.target}`;
        
        if (files.has(filePath)) {
            try {
                // Get the XML content
                const xmlData = files.get(filePath);
                const xmlString = new TextDecoder().decode(xmlData);
                
                // Replace placeholders
                let updatedXml = xmlString;
                
                // Format version as "VERSION 00000001"
                const formattedVersion = `VERSION ${version.toString().padStart(8, '0')}`;
                
                // Replace &lt;VERSION&gt; with formatted version
                updatedXml = updatedXml.replace(/<VERSION>/g, formattedVersion);
                updatedXml = updatedXml.replace(/&lt;VERSION&gt;/g, formattedVersion);
                
                // Replace &lt;COURSE CODE&gt; with course code
                updatedXml = updatedXml.replace(/<COURSE CODE>/g, courseCode);
                updatedXml = updatedXml.replace(/&lt;COURSE CODE&gt;/g, courseCode);
                
                // Update the file in the map
                files.set(filePath, new TextEncoder().encode(updatedXml));
                
            } catch (error) {
                console.error('Error processing header file', filePath, ':', error);
            }
        }
    });
} 