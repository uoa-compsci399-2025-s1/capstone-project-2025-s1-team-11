import { loadDocx, copyRelatedFiles } from "../loaders/docxLoader.js";
import { extractRefs, findAndRemoveFirstSectPr } from "../processors/documentStructureProcessor.js";
import {
    extractRelationships,
    processRelationships,
    updateRelationshipIds,
    updateRelationshipsXml
} from "../processors/relationshipProcessor.js";
import { findFirstPageBreak, isPageBreakSameAsSectPr } from "../processors/pageBreakProcessor.js";
import { preserveWhitespace, xmlBuilder } from "../utils/xmlHelpers.js";
import JSZip from "jszip";
import { RELATIONSHIP_TYPES } from "../utils/docxConstants.js";
import { parseContentTypes, buildContentTypesXml, mergeContentTypes } from "../contentProcessors/contentTypeProcessor.js";

/**
 * Merges two docx files, inserting the body content after the first page break in the cover page
 */
export async function mergeDocxFiles(coverPageFile, bodyFile) {
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

        // Find the first page break in the cover page
        const pageBreakIndex = findFirstPageBreak(coverBody);

        const {relIdMap, newRelationships, mediaFileMap} = processRelationships(coverRelationships, bodyRelationships);

        // If the first page break is not the same as the first section break, paste the removed sectPr at the page break
        if (removedSectPr && pageBreakIndex !== -1 && !isPageBreakSameAsSectPr(sectPrLoc, pageBreakIndex)) {
            const targetParaObject = coverBody[pageBreakIndex];

            if (targetParaObject && targetParaObject['w:p'] && Array.isArray(targetParaObject['w:p'])) {
                const pChildrenArray = targetParaObject['w:p'];

                // Remove runs containing page breaks and other page break markers
                for (let i = pChildrenArray.length - 1; i >= 0; i--) {
                    const pChild = pChildrenArray[i];

                    // Remove entire runs that contain page breaks
                    if (pChild['w:r'] && Array.isArray(pChild['w:r'])) {
                        const hasPageBreak = pChild['w:r'].some(run => {
                            const isPageBreakRun = run['w:br'] !== undefined &&
                                run[':@'] &&
                                run[':@']['@_w:type'] === 'page';

                            const hasNestedPageBreak = run['w:br'] &&
                                Array.isArray(run['w:br']) &&
                                run['w:br'].some(br => br[':@'] && br[':@']['@_w:type'] === 'page');

                            return isPageBreakRun || hasNestedPageBreak;
                        });
                        if (hasPageBreak) {
                            pChildrenArray.splice(i, 1);
                            continue;
                        }
                    }

                    // Remove w:br with type="page" from runs
                    if (pChild['w:br'] && Array.isArray(pChild['w:br'])) {
                        const originalLength = pChild['w:br'].length;
                        pChild['w:br'] = pChild['w:br'].filter(br => {
                            return !(br[':@'] && br[':@']['@_w:type'] === 'page');
                        });
                        if (pChild['w:br'].length === 0 && originalLength > 0) {
                            pChildrenArray.splice(i, 1);
                        }
                    }

                    // Remove w:pageBreakBefore from w:pPr
                    if (pChild['w:pPr'] && Array.isArray(pChild['w:pPr']) &&
                        pChild['w:pPr'][0] && pChild['w:pPr'][0]['w:pageBreakBefore']) {
                        delete pChild['w:pPr'][0]['w:pageBreakBefore'];
                    }
                }

                // Add section break to the paragraph properties
                let pPrObjectContainer = null;
                if (pChildrenArray.length > 0 && pChildrenArray[0]['w:pPr'] && Array.isArray(pChildrenArray[0]['w:pPr'])) {
                    pPrObjectContainer = pChildrenArray[0];
                } else {
                    pPrObjectContainer = {'w:pPr': [{}]};
                    pChildrenArray.unshift(pPrObjectContainer);
                }
                const pPrObject = pPrObjectContainer['w:pPr'][0];

                // Remove any existing sectPr before adding the new one
                if (pPrObject['w:sectPr']) {
                    delete pPrObject['w:sectPr'];
                }

                pPrObject['w:sectPr'] = removedSectPr;
            }
        }

        // Update relationship IDs in the body content ONLY
        updateRelationshipIds(bodyContent, relIdMap);

        preserveWhitespace(coverPage.documentObj);
        preserveWhitespace(bodyDoc);

        // Insert the exam body after the relocated first section break
        coverBody.splice(pageBreakIndex !== -1 ? pageBreakIndex + 1 : coverBody.length, 0, ...bodyContent);

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

        // Copy related files
        copyRelatedFiles(body, coverPage, bodyRelationships, relIdMap, mediaFileMap);

        const outputZip = new JSZip();
        for (const [path, content] of coverPage.files.entries()) {
            outputZip.file(path, content);
        }
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

        return await outputZip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
    } catch (error) {
        console.error('Error merging docx files:', error);
        throw error;
    }
}