import { loadDocx, copyRelatedFiles } from "../loaders/docxLoader.js";
import { findAndRemoveFirstSectPr } from "../processors/documentStructureProcessor.js";
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
        const insertIndex = pageBreakIndex !== -1 ? pageBreakIndex + 1 : coverBody.length;
        coverBody.splice(insertIndex, 0, ...bodyContent);

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

        // 🔬 DEBUG: Inspect document object before xmlBuilder
        console.log('🔬 STAGE 0: Inspecting document object before xmlBuilder...');
        
        // Find first math element in document object
        const findFirstMathInObject = (obj, path = '') => {
            if (!obj || typeof obj !== 'object') return null;
            
            if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    const result = findFirstMathInObject(obj[i], `${path}[${i}]`);
                    if (result) return result;
                }
                return null;
            }
            
            // Check if this object contains math
            for (const [key, value] of Object.entries(obj)) {
                if (key.startsWith('m:') || (typeof value === 'string' && value.includes('<m:'))) {
                    return { path: `${path}.${key}`, key, value: typeof value === 'string' ? value.substring(0, 200) + '...' : value };
                }
                
                if (typeof value === 'object' && value !== null) {
                    const result = findFirstMathInObject(value, `${path}.${key}`);
                    if (result) return result;
                }
            }
            return null;
        };
        
        const firstMathObj = findFirstMathInObject(coverDoc, 'coverDoc');
        if (firstMathObj) {
            console.log('🔬 STAGE 0: First math in document object:', firstMathObj);
        } else {
            console.log('🔬 STAGE 0: No math content found in document object');
        }

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
        
        // 🧪 EXPERIMENTAL: Try to get original XML instead of rebuilding
        console.log('🧪 EXPERIMENT: Attempting to use original body XML...');
        let alternativeDocXml = null;
        try {
            // Get the original document XML from the body file
            const bodyDocXmlData = body.files.get('word/document.xml');
            if (bodyDocXmlData) {
                const bodyDocXml = new TextDecoder().decode(bodyDocXmlData);
                console.log('🧪 EXPERIMENT: Successfully extracted original body XML, length:', bodyDocXml.length);
                
                // Quick check for corruption in original
                if (bodyDocXml.includes('m:val=&quot;')) {
                    console.log('🧪 EXPERIMENT: ❌ Original body XML already has escaped quotes');
                } else {
                    console.log('🧪 EXPERIMENT: ✅ Original body XML has clean quotes');
                    alternativeDocXml = bodyDocXml;
                }
            }
        } catch (error) {
            console.log('🧪 EXPERIMENT: Failed to extract original XML:', error.message);
        }
        
        // 🔬 SYSTEMATIC DEBUG: Capture exact XML at each stage
        console.log('🔬 STAGE 1: XML length after xmlBuilder.build():', updatedDocXml.length);
        
        // 🔍 DEBUG: Quick XML validation to get error details
        let errorLine = null;
        let errorDetails = null;
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(updatedDocXml, 'text/xml');
            const parseError = xmlDoc.getElementsByTagName('parsererror');
            
            if (parseError.length > 0) {
                errorDetails = parseError[0].textContent;
                // Extract line number from error message
                const lineMatch = errorDetails.match(/line (\d+)/);
                if (lineMatch) {
                    errorLine = parseInt(lineMatch[1]);
                }
                console.error('🔍 MERGE: ❌ XML parsing error detected:', errorDetails);
            } else {
                console.log('🔍 MERGE: ✅ Final merged XML appears well-formed');
            }
        } catch (validationError) {
            console.error('🔍 MERGE: Error validating XML:', validationError);
        }
        
        // Show content around the error line if we found one
        const lines = updatedDocXml.split('\n');
        if (errorLine && lines.length > errorLine) {
            console.log(`🔬 STAGE 2: Content around ERROR line ${errorLine}:`);
            for (let i = Math.max(0, errorLine - 3); i < Math.min(lines.length, errorLine + 3); i++) {
                const marker = i + 1 === errorLine ? '❌' : '  ';
                console.log(`${marker} Line ${i + 1}: ${lines[i]}`);
            }
        } else if (lines.length > 7410) {
            // Fallback to original line 7411 area
            console.log('🔬 STAGE 2: Content around line 7411:');
            for (let i = Math.max(0, 7408); i < Math.min(lines.length, 7415); i++) {
                console.log(`Line ${i + 1}: ${lines[i]}`);
            }
        }
        
        // Look for first math content after xmlBuilder
        const firstMathMatch = updatedDocXml.match(/<m:oMath[\s\S]{0,300}/);
        if (firstMathMatch) {
            console.log('🔬 STAGE 3: First math content after xmlBuilder:');
            console.log(firstMathMatch[0] + '...');
        }
        
        // Check for specific corruption patterns including the new issue
        const corruptionChecks = [
            { pattern: /w:txml:space/, name: 'MISSING_SPACE_IN_ATTRIBUTES' },
            { pattern: /m:val=&quot;/, name: 'ESCAPED_QUOTES_IN_ATTRIBUTES' },
            { pattern: /<m:[^>]*&[^;]*[^>]*>/, name: 'ENTITIES_IN_MATH_TAGS' },
            { pattern: /="[^"]*<[^"]*"/, name: 'ANGLE_BRACKETS_IN_ATTRIBUTES' }
        ];
        
        console.log('🔬 STAGE 4: Corruption pattern analysis:');
        corruptionChecks.forEach(check => {
            const matches = updatedDocXml.match(new RegExp(check.pattern, 'g'));
            if (matches) {
                console.log(`❌ ${check.name}: Found ${matches.length} instances`);
                console.log(`   First match: ${matches[0]}`);
            } else {
                console.log(`✅ ${check.name}: Clean`);
            }
        });
        
        if (updatedDocXml.includes('<m:oMath>') && updatedDocXml.includes('<m:oMathPara>')) {
            console.log('🔍 MERGE: ✅ Math content found in merged document');
        }
        
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