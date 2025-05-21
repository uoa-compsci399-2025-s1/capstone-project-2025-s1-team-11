import JSZip from "jszip";
import { xmlParser } from "../utils/xmlHelpers.js";
import { RELATIONSHIP_TYPES } from "../utils/docxConstants.js";

/**
 * Loads and parses a docx file
 */
export async function loadDocx(file) {
    const zip = new JSZip();
    const content = await file.arrayBuffer();
    const docx = await zip.loadAsync(content);

    const documentXml = await docx.file('word/document.xml')?.async('string');
    if (!documentXml) {
        throw new Error('Could not read document.xml in the docx file');
    }

    const relationshipsXml = await docx.file('word/_rels/document.xml.rels')?.async('string') || '';

    const documentObj = xmlParser.parse(documentXml);

    const files = new Map();
    await Promise.all(
        Object.keys(docx.files).map(async (path) => {
            const zipFile = docx.files[path];
            if (!zipFile.dir) {
                files.set(path, await zipFile.async('uint8array'));
            }
        })
    );

    return {documentXml, relationshipsXml, files, documentObj, relationshipsObj: null};
}

/**
 * Copies files referenced by relationships
 */
export function copyRelatedFiles(body, coverPage, bodyRels, relIdMap, mediaFileMap) {
    for (const rel of bodyRels) {
        if (!relIdMap.has(rel.id)) continue;

        const originalPath = `word/${rel.target}`;
        let targetPath = originalPath;

        // If this file was renamed due to conflict, use the new path
        if (mediaFileMap.has(rel.target)) {
            targetPath = `word/${mediaFileMap.get(rel.target)}`;
        }

        // Only copy if the file exists and isn't already in cover page
        if (body.files.has(originalPath) &&
            !coverPage.files.has(targetPath) &&
            (rel.type === RELATIONSHIP_TYPES.IMAGE ||
                rel.type === RELATIONSHIP_TYPES.HEADER ||
                rel.type === RELATIONSHIP_TYPES.FOOTER ||
                rel.type === RELATIONSHIP_TYPES.THEME)) {

            if (rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER) {
                // console.log('[HEADER-DEBUG] Copying header/footer file:', {
                //     from: originalPath,
                //     to: targetPath,
                //     type: rel.type === RELATIONSHIP_TYPES.HEADER ? 'HEADER' : 'FOOTER'
                // });
            }

            coverPage.files.set(targetPath, body.files.get(originalPath));
        }
    }
}