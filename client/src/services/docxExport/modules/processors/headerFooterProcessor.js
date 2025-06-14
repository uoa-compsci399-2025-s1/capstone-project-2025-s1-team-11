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
                
                // Check if this file contains SDT (Structured Document Tag) content
                const hasSdt = updatedXml.includes('<w:sdt>');
                if (hasSdt) {
                    console.log('[HEADER-DEBUG] File', filePath, 'contains SDT content');
                    // Show the SDT content specifically
                    const sdtMatch = updatedXml.match(/<w:sdtContent>[\s\S]*?<\/w:sdtContent>/);
                    if (sdtMatch) {
                        console.log('[HEADER-DEBUG] SDT content:', sdtMatch[0]);
                    }
                }
                
                // Replace &lt;VERSION&gt; with formatted version
                const beforeReplace = updatedXml;
                updatedXml = updatedXml.replace(/<VERSION>/g, formattedVersion);
                updatedXml = updatedXml.replace(/&lt;VERSION&gt;/g, formattedVersion);
                
                // Replace &lt;COURSE CODE&gt; with course code
                updatedXml = updatedXml.replace(/<COURSE CODE>/g, courseCode);
                updatedXml = updatedXml.replace(/&lt;COURSE CODE&gt;/g, courseCode);
                
                // Fix SDTs that contain our placeholders by removing data binding
                if (hasSdt && (beforeReplace.includes('&lt;VERSION&gt;') || beforeReplace.includes('&lt;COURSE CODE&gt;'))) {
                    console.log('[HEADER-DEBUG] Removing data binding from SDTs with placeholders in', filePath);
                    // Remove data binding elements that might override our content
                    updatedXml = updatedXml.replace(/<w:dataBinding[^>]*\/>/g, '');
                    updatedXml = updatedXml.replace(/<w:dataBinding[^>]*>.*?<\/w:dataBinding>/g, '');
                }
                
                // Check if replacement actually happened
                const wasReplaced = beforeReplace !== updatedXml;
                console.log('[HEADER-DEBUG] File', filePath, 'replacement occurred:', wasReplaced);
                if (!wasReplaced && (beforeReplace.includes('&lt;VERSION&gt;') || beforeReplace.includes('<VERSION>'))) {
                    console.log('[HEADER-DEBUG] WARNING: VERSION placeholder found but not replaced in', filePath);
                }
                
                // Update the file in the map
                files.set(filePath, new TextEncoder().encode(updatedXml));
                
            } catch (error) {
                console.error('Error processing header file', filePath, ':', error);
            }
        }
    });
} 