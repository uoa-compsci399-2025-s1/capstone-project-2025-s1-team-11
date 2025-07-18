﻿import { loadDocx, copyRelatedFiles } from "../loaders/docxLoader.js";
import { findAndRemoveFirstSectPr } from "../processors/documentStructureProcessor.js";
import {
    extractRelationships,
    processRelationships,
    updateRelationshipIds,
    updateRelationshipsXml
} from "../processors/relationshipProcessor.js";
import { processHeaders } from "../processors/headerFooterProcessor.js";
import { preserveWhitespace, xmlBuilder } from "../utils/xmlHelpers.js";
import JSZip from "jszip";
import { RELATIONSHIP_TYPES } from "../utils/docxConstants.js";
import { parseContentTypes, buildContentTypesXml, mergeContentTypes } from "../contentProcessors/contentTypeProcessor.js";

/**
 * Merges two docx files, inserting the body content after the first page break in the cover page
 * @param {Blob} coverPageFile - The cover page DOCX file
 * @param {Blob} bodyFile - The exam body DOCX file
 * @param {Object} examData - The exam data containing courseCode
 * @param {string|number} version - The version being exported
 */
export async function mergeDocxFiles(coverPageFile, bodyFile, examData = null, version = null) {
    try {
        const coverPage = await loadDocx(coverPageFile);
        const body = await loadDocx(bodyFile);
        
        const coverDoc = coverPage.documentObj.find((el) => 'w:document' in el);
        const coverBodyContainer = coverDoc['w:document'].find((el) => 'w:body' in el);
        if (!coverBodyContainer) throw new Error('Invalid cover page structure: missing w:body');
        const coverBody = coverBodyContainer['w:body'];

        // Find and preserve the final section properties from the cover page
        const finalSectPr = coverBody.find(el => el['w:sectPr']);

        const bodyDoc = body.documentObj.find((el) => 'w:document' in el);
        const bodyRelationships = extractRelationships(body.relationshipsXml);
        const bodyContent = bodyDoc['w:document'].find((el) => 'w:body' in el)?.['w:body'] || [];
        const coverRelationships = extractRelationships(coverPage.relationshipsXml);

        // Find and remove the first <w:sectPr>
        const sectPrLoc = findAndRemoveFirstSectPr(coverBody);
        const removedSectPr = sectPrLoc ? sectPrLoc.sectPr : null;

        const {relIdMap, newRelationships, mediaFileMap} = processRelationships(coverRelationships, bodyRelationships);

        // Process headers to replace placeholders
        if (examData && version !== null) {
            processHeaders(coverPage.files, coverRelationships, version, examData.courseCode || '');
        }

        // If we have a section break location, insert a page break before it
        if (sectPrLoc) {
            // Insert the exam body at the section break location
            const insertIndex = sectPrLoc.index;
            
            // Add page break to the first paragraph of the body content
            if (bodyContent.length > 0 && bodyContent[0]['w:p'] && Array.isArray(bodyContent[0]['w:p'])) {
                const firstPara = bodyContent[0]['w:p'];
                let pPrContainer = null;
                
                // Find or create paragraph properties
                if (firstPara.length > 0 && firstPara[0]['w:pPr'] && Array.isArray(firstPara[0]['w:pPr'])) {
                    pPrContainer = firstPara[0];
                } else {
                    pPrContainer = {'w:pPr': [{}]};
                    firstPara.unshift(pPrContainer);
                }
                
                const pPrObject = pPrContainer['w:pPr'][0];
                pPrObject['w:pageBreakBefore'] = [{}];
            }
            
            coverBody.splice(insertIndex, 0, ...bodyContent);

            // Add the section break back at its original location (after the inserted body content)
            const targetParaObject = coverBody[insertIndex + bodyContent.length];
            if (targetParaObject && targetParaObject['w:p'] && Array.isArray(targetParaObject['w:p'])) {
                const pChildrenArray = targetParaObject['w:p'];
                let pPrObjectContainer = null;
                
                if (pChildrenArray.length > 0 && pChildrenArray[0]['w:pPr'] && Array.isArray(pChildrenArray[0]['w:pPr'])) {
                    pPrObjectContainer = pChildrenArray[0];
                } else {
                    pPrObjectContainer = {'w:pPr': [{}]};
                    pChildrenArray.unshift(pPrObjectContainer);
                }
                
                const pPrObject = pPrObjectContainer['w:pPr'][0];
                pPrObject['w:sectPr'] = removedSectPr;
            }
        } else {
            // No section break - append to the end
            coverBody.push(...bodyContent);
        }

        // Ensure the final section properties are preserved
        if (finalSectPr) {
            // Remove any existing final section properties
            const lastSectPrIndex = coverBody.findIndex(el => el['w:sectPr']);
            if (lastSectPrIndex !== -1) {
                coverBody.splice(lastSectPrIndex, 1);
            }
            // Add back the preserved final section properties
            coverBody.push(finalSectPr);
        }

        // Update relationship IDs in the body content ONLY
        updateRelationshipIds(bodyContent, relIdMap);

        preserveWhitespace(coverPage.documentObj);
        preserveWhitespace(bodyDoc);

        // Copy related files
        copyRelatedFiles(body, coverPage, bodyRelationships, relIdMap, mediaFileMap);

        const outputZip = new JSZip();
        
        // First, add all cover page files (including our modified headers)
        for (const [path, content] of coverPage.files.entries()) {
            outputZip.file(path, content);
        }
        
        // Then, add body files that don't conflict with cover page files
        for (const [path, content] of body.files.entries()) {
            if (!coverPage.files.has(path) && path.startsWith('word/media/')) {
                outputZip.file(path, content);
            }
            const isNewReferencedHeaderOrFooter = newRelationships.some(rel =>
                (rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER) &&
                `word/${rel.target}` === path
            );
            if (!coverPage.files.has(path) && isNewReferencedHeaderOrFooter) {
                outputZip.file(path, content);
            }
        }

        const updatedDocXml = xmlBuilder.build([coverDoc]);
        
        outputZip.file('word/document.xml', updatedDocXml);
        
        const updatedRelXml = updateRelationshipsXml(coverPage.relationshipsXml, newRelationships);
        outputZip.file('word/_rels/document.xml.rels', updatedRelXml);
        
        const coverContentTypesData = coverPage.files.get('[Content_Types].xml');
        const bodyContentTypesData = body.files.get('[Content_Types].xml');
        const coverContentTypesXml = coverContentTypesData ? new TextDecoder().decode(coverContentTypesData) : '';
        const bodyContentTypesXml = bodyContentTypesData ? new TextDecoder().decode(bodyContentTypesData) : '';
        const coverContentTypes = parseContentTypes(coverContentTypesXml || '');
        const bodyContentTypes = parseContentTypes(bodyContentTypesXml || '');
        const mergedContentTypes = mergeContentTypes(coverContentTypes, bodyContentTypes);
        const contentTypesXml = buildContentTypesXml(mergedContentTypes);
        outputZip.file('[Content_Types].xml', contentTypesXml);

        const result = await outputZip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        
        return result;
    } catch (error) {
        console.error('🔍 MERGE: Error in mergeDocxFiles():', error);
        console.error('Something failed in mergeDocxFiles():', error);
        throw error;
    }
}