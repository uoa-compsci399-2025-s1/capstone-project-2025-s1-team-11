import JSZip from 'jszip';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const RELATIONSHIP_TYPES = {
  IMAGE: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
  HEADER: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header',
  FOOTER: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer',
  THEME: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
  STYLES: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
  NUMBERING: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering',
  FONTS: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable',
  SETTINGS: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings',
  WEBSETTINGS: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings',
  FOOTNOTES: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes',
  ENDNOTES: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes',
};

// XML parsing configuration
const xmlParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  trimValues: false
};

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  format: true
});

const xmlParser = new XMLParser(xmlParserOptions);

/**
 * Checks if an element contains any type of page break
 */
function findPageBreakType(element) {
  if (!element || typeof element !== 'object') return null;

  // Check for explicit page break
  if ('w:br' in element && element[':@']?.['@_w:type'] === 'page') {
    return 'explicit';
  }

  // Check for pageBreakBefore
  if ('w:pageBreakBefore' in element) {
    return 'before';
  }

  // Check for last rendered page break
  if ('w:lastRenderedPageBreak' in element) {
    return 'rendered';
  }

  // Check for section break
  if ('w:sectPr' in element) {
    const sectPr = element['w:sectPr'];
    // Check for explicit next page type
    if (Array.isArray(sectPr) && sectPr[0]?.['w:type']?.[0]?.[':@']?.['@_w:val'] === 'nextPage') {
      return 'section';
    }
    // Any section break implies a page break
    return 'section';
  }

  // Recursively check nested elements
  for (const value of Object.values(element)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const result = findPageBreakType(item);
        if (result) return result;
      }
    } else if (typeof value === 'object' && value !== null) {
      const result = findPageBreakType(value);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Finds the index of the first page break in the document body
 */
function findFirstPageBreak(documentBody) {
  for (let i = 0; i < documentBody.length; i++) {
    const element = documentBody[i];
    if ('w:p' in element && findPageBreakType(element)) {
      return i;
    }
  }
  return -1;
}

/**
 * Updates relationship IDs in the body content to avoid conflicts
 */
function updateRelationshipIds(content, relIdMap) {
  const updateIds = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(updateIds);
      return;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      if ((key === '@_r:id' || key === '@_r:embed') && typeof value === 'string' && relIdMap.has(value)) {
        const oldId = value;
        const newId = relIdMap.get(value);
        if (obj[':@'] && obj[':@']['@_w:type'] === 'header' || obj[':@'] && obj[':@']['@_w:type'] === 'footer') {
          console.log('[HEADER-DEBUG] Updating reference ID:', {
            type: obj[':@']['@_w:type'],
            oldId,
            newId
          });
        }
        obj[key] = newId;
      } else if (typeof value === 'object' && value !== null) {
        updateIds(value);
      }
    }
  };

  content.forEach(updateIds);
}

/**
 * Ensures whitespace is preserved in text nodes
 */
function preserveWhitespace(obj) {
  if (!obj || typeof obj !== 'object') return;
  
  if (Array.isArray(obj)) {
    obj.forEach(preserveWhitespace);
    return;
  }

  // Handle text nodes - just ensure the preserve attribute is set
  if ('w:t' in obj && !obj[':@']?.['@_xml:space']) {
    if (!obj[':@']) obj[':@'] = {};
    obj[':@']['@_xml:space'] = 'preserve';
  }
  
  // Recursively process all object properties
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      preserveWhitespace(value);
    }
  }
}

/**
 * Loads and parses a docx file
 */
async function loadDocx(file) {
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
  
  return { documentXml, relationshipsXml, files, documentObj, relationshipsObj: null };
}

/**
 * Parses [Content_Types].xml file content
 */
function parseContentTypes(xml) {
  if (!xml) return [];
  
  const contentTypes = [];
  const doc = xmlParser.parse(xml);
  
  // Types element is in the second element of the array
  const types = doc[1]?.Types;
  if (!types) {
    console.warn('No Types element found in Content_Types.xml');
    return [];
  }
  
  // Process all elements in Types array
  types.forEach((item) => {
    // Handle Default entries
    if ('Default' in item) {
      const attrs = item[':@'];
      if (attrs) {
        contentTypes.push({
          isDefault: true,
          extension: attrs['@_Extension'],
          contentType: attrs['@_ContentType']
        });
      }
    }
    
    // Handle Override entries
    if ('Override' in item) {
      const attrs = item[':@'];
      if (attrs) {
        contentTypes.push({
          isDefault: false,
          partName: attrs['@_PartName'],
          contentType: attrs['@_ContentType']
        });
      }
    }
  });
  
  return contentTypes;
}

/**
 * Merges content types from two documents
 */
export function mergeContentTypes(coverTypes, bodyTypes) {
  const merged = new Map();
  
  // Helper to add a content type, preserving the first occurrence
  const addContentType = (ct) => {
    const key = ct.isDefault ? `default:${ct.extension}` : `override:${ct.partName}`;
    if (!merged.has(key)) {
      merged.set(key, ct);
    }
  };

  // Add ALL cover page types first (they take precedence)
  coverTypes.forEach(ct => addContentType(ct));
  
  // Add body types only if they don't conflict with cover page types
  bodyTypes.forEach(ct => addContentType(ct));
  
  // Ensure we have basic required defaults
  const ensureDefault = (extension, contentType) => {
    const key = `default:${extension}`;
    if (!merged.has(key)) {
      merged.set(key, {
        isDefault: true,
        extension,
        contentType
      });
    }
  };
  
  // Ensure minimum required defaults
  ensureDefault('rels', 'application/vnd.openxmlformats-package.relationships+xml');
  ensureDefault('xml', 'application/xml');
  
  return Array.from(merged.values());
}

/**
 * Builds [Content_Types].xml content
 */
export function buildContentTypesXml(contentTypes) {
  const defaults = contentTypes.filter(ct => ct.isDefault);
  const overrides = contentTypes.filter(ct => !ct.isDefault);
  
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  xml += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">';
  
  // Add defaults first
  defaults.forEach(ct => {
    xml += `<Default Extension="${ct.extension}" ContentType="${ct.contentType}"/>`;
  });
  
  // Then add overrides
  overrides.forEach(ct => {
    xml += `<Override PartName="${ct.partName}" ContentType="${ct.contentType}"/>`;
  });
  
  xml += '</Types>';
  return xml;
}

/**
 * Generates a new unique media file name by incrementing a number suffix
 */
function generateUniqueMediaName(originalPath, existingFiles) {
  const dir = originalPath.substring(0, originalPath.lastIndexOf('/') + 1);
  const filename = originalPath.substring(originalPath.lastIndexOf('/') + 1);
  const ext = filename.substring(filename.lastIndexOf('.'));
  const basename = filename.substring(0, filename.lastIndexOf('.'));
  
  // Extract number from basename if it exists (e.g., "image1" -> "image" and "1")
  const match = basename.match(/^(.*?)(\d*)$/);
  const prefix = match[1];
  let counter = match[2] ? parseInt(match[2]) : 0;
  
  // Keep incrementing counter until we find a unique name
  let newPath;
  do {
    counter++;
    newPath = `${dir}${prefix}${counter}${ext}`;
  } while (existingFiles.has(`word/${newPath}`));
  
  return newPath;
}

/**
 * Processes relationships from both documents and creates mapping for updates
 */
function processRelationships(coverRels, bodyRels) {
  const relIdMap = new Map();
  const newRelationships = [];
  const mediaFileMap = new Map();

  // Find highest rId in cover page
  let maxRid = coverRels.reduce((max, rel) => {
    const idMatch = rel.id.match(/rId(\d+)/);
    return idMatch ? Math.max(max, parseInt(idMatch[1])) : max;
  }, 0);

  // Create map of cover page relationships by target path
  const coverRelsByTarget = new Map();
  console.log('[HEADER-DEBUG] Cover page relationships:', coverRels.filter(rel => 
    rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER
  ).map(rel => ({ id: rel.id, target: rel.target })));
  
  coverRels.forEach(rel => {
    coverRelsByTarget.set(rel.target, rel);
  });

  // Process body relationships
  console.log('[HEADER-DEBUG] Body relationships before processing:', bodyRels.filter(rel => 
    rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER
  ).map(rel => ({ id: rel.id, target: rel.target })));

  for (const rel of bodyRels) {
    const existingRel = coverRelsByTarget.get(rel.target);
    
    // For headers/footers, we want to reuse existing relationships if they exist
    if (existingRel && 
        existingRel.type === rel.type && 
        (rel.type === RELATIONSHIP_TYPES.HEADER || 
         rel.type === RELATIONSHIP_TYPES.FOOTER)) {
      // Use existing relationship for headers/footers
      console.log('[HEADER-DEBUG] Reusing existing header/footer:', {
        bodyId: rel.id,
        coverPageId: existingRel.id,
        target: rel.target
      });
      relIdMap.set(rel.id, existingRel.id);
      continue;
    }

    // Generate new relationship ID
    maxRid++;
    const newId = `rId${maxRid}`;
    relIdMap.set(rel.id, newId);

    // Handle file name conflicts
    let target = rel.target;
    if (coverRelsByTarget.has(target)) {
      if (rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER) {
        console.log('[HEADER-DEBUG] Header/footer name conflict:', {
          originalTarget: target,
          bodyId: rel.id,
          newId: newId
        });
      }
      
      // Extract path parts
      const lastSlash = target.lastIndexOf('/');
      const dir = lastSlash >= 0 ? target.substring(0, lastSlash + 1) : '';
      const filename = lastSlash >= 0 ? target.substring(lastSlash + 1) : target;
      const ext = filename.substring(filename.lastIndexOf('.'));
      const basename = filename.substring(0, filename.lastIndexOf('.'));
      
      // Extract number from basename if it exists
      const match = basename.match(/^(.*?)(\d*)$/);
      const prefix = match[1];
      let counter = match[2] ? parseInt(match[2]) : 0;
      
      // Keep incrementing counter until we find a unique name
      let newTarget;
      do {
        counter++;
        newTarget = `${dir}${prefix}${counter}${ext}`;
      } while (coverRelsByTarget.has(newTarget));
      
      if (rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER) {
        console.log('[HEADER-DEBUG] Generated new header/footer name:', {
          originalTarget: target,
          newTarget: newTarget,
          bodyId: rel.id,
          newId: newId
        });
      }
      
      mediaFileMap.set(target, newTarget);
      target = newTarget;
    }

    newRelationships.push({
      id: newId,
      type: rel.type,
      target: target
    });
  }

  console.log('[HEADER-DEBUG] Final relationship mapping for headers/footers:', 
    Array.from(relIdMap.entries())
      .filter(([oldId]) => bodyRels.find(rel => 
        rel.id === oldId && 
        (rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER)
      ))
      .map(([oldId, newId]) => ({
        oldId,
        newId,
        target: bodyRels.find(rel => rel.id === oldId)?.target
      }))
  );

  return { relIdMap, newRelationships, mediaFileMap };
}

/**
 * Copies files referenced by relationships
 */
function copyRelatedFiles(body, coverPage, bodyRels, relIdMap, mediaFileMap) {
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
        console.log('[HEADER-DEBUG] Copying header/footer file:', {
          from: originalPath,
          to: targetPath,
          type: rel.type === RELATIONSHIP_TYPES.HEADER ? 'HEADER' : 'FOOTER'
        });
      }
      
      coverPage.files.set(targetPath, body.files.get(originalPath));
    }
  }
}

function extractRelationships(relationshipsXml) {
  const relationships = [];
  const regex = /<Relationship\s+Id="([^"]+)"\s+Type="([^"]+)"\s+Target="([^"]+)"/g;
  
  let match;
  while ((match = regex.exec(relationshipsXml)) !== null) {
    relationships.push({
      id: match[1],
      type: match[2],
      target: match[3]
    });
  }
  
  return relationships;
}

function updateRelationshipsXml(originalXml, newRelationships) {
  if (!originalXml || originalXml.trim() === '') {
    // Create new relationships XML if none exists
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    xml += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
    
    for (const rel of newRelationships) {
      xml += `  <Relationship Id="${rel.id}" Type="${rel.type}" Target="${rel.target}"/>\n`;
    }
    
    xml += '</Relationships>';
    return xml;
  }
  
  // Add new relationships before the closing tag
  const closingTag = '</Relationships>';
  const insertIndex = originalXml.lastIndexOf(closingTag);
  
  if (insertIndex === -1) {
    throw new Error('Invalid relationships XML format');
  }
  
  let updatedXml = originalXml.substring(0, insertIndex);
  
  for (const rel of newRelationships) {
    updatedXml += `  <Relationship Id="${rel.id}" Type="${rel.type}" Target="${rel.target}"/>\n`;
  }
  
  updatedXml += closingTag;
  
  return updatedXml;
}

/**
 * Extracts section properties from a document body
 */
function extractSectionProperties(body) {
  const sectPr = [];
  
  // Find all section properties in the document
  body.forEach((element, index) => {
    if ('w:p' in element) {
      const paragraph = element['w:p'];
      // Look for section properties in paragraphs
      paragraph.forEach(pElement => {
        if ('w:sectPr' in pElement) {
          sectPr.push({
            properties: pElement['w:sectPr'],
            index: index
          });
        }
      });
    }
  });
  
  return sectPr;
}

/**
 * Updates header references in section properties
 */
function updateHeaderReferences(sectPr, relIdMap) {
  if (!Array.isArray(sectPr)) return;
  
  sectPr.forEach(element => {
    if ('w:headerReference' in element) {
      const headerRef = element['w:headerReference'];
      if (headerRef[0] && headerRef[0][':@']) {
        const rId = headerRef[0][':@']['@_r:id'];
        if (relIdMap.has(rId)) {
          headerRef[0][':@']['@_r:id'] = relIdMap.get(rId);
        }
      }
    }
  });
}

// Helper to find and clone the FIRST w:sectPr in a document body array
function findAndCloneFirstSectPr(docBodyArray) {
  for (let i = 0; i < docBodyArray.length; i++) {
    const blockElement = docBodyArray[i];

    // Case 1: w:sectPr is a direct child of w:body (e.g. last element, but we search from start)
    if (blockElement && blockElement['w:sectPr'] && Array.isArray(blockElement['w:sectPr'])) {
      const sectPrCandidate = blockElement;
      try {
        return JSON.parse(JSON.stringify(sectPrCandidate));
      } catch (e) {
        console.error('Error cloning direct w:sectPr in findAndCloneFirstSectPr:', e);
        return null;
      }
    }

    // Case 2: w:sectPr is within a w:p (paragraph) element
    if (blockElement && blockElement['w:p'] && Array.isArray(blockElement['w:p'])) {
      const pChildren = blockElement['w:p'];
      for (let j = 0; j < pChildren.length; j++) {
        const pChild = pChildren[j];
        let sectPrObject = null;

        // Subcase 2a: w:sectPr is directly a child of w:p
        if (pChild && pChild['w:sectPr'] && Array.isArray(pChild['w:sectPr'])) {
          sectPrObject = pChild;
        }
        // Subcase 2b: w:sectPr is within w:pPr (paragraph properties)
        else if (pChild && pChild['w:pPr'] && Array.isArray(pChild['w:pPr']) &&
                 pChild['w:pPr'][0] && typeof pChild['w:pPr'][0] === 'object' &&
                 pChild['w:pPr'][0]['w:sectPr'] && Array.isArray(pChild['w:pPr'][0]['w:sectPr'])) {
          sectPrObject = pChild['w:pPr'][0]['w:sectPr'][0];
        }

        if (sectPrObject) {
          try {
            return JSON.parse(JSON.stringify(sectPrObject));
          } catch (e) {
            console.error('Error cloning w:sectPr from paragraph:', e);
            return null;
          }
        }
      }
    }
  }
  console.warn("No w:sectPr found in document");
  return null;
}

function isPageBreakSameAsSectPr(sectPrLoc, pageBreakIndex) {
  if (!sectPrLoc || pageBreakIndex === -1) return false;
  return sectPrLoc.index === pageBreakIndex;
}

/**
 * Helper function to safely extract header/footer references from section properties
 */
function extractRefs(sectPr, refType) {
  if (!Array.isArray(sectPr)) return [];
  
  return sectPr
    .filter(item => item[refType] && Array.isArray(item[refType]) && item[refType][0] && item[refType][0][':@'])
    .map(item => ({
      type: item[refType][0][':@']['@_w:type'] || 'unknown',
      id: item[refType][0][':@']['@_r:id'] || 'unknown'
    }));
}

/**
 * Helper to find and remove the first <w:sectPr> and return its value and location
 */
function findAndRemoveFirstSectPr(docBodyArray) {
  let firstSectPr = null;
  let location = null;

  // Recursive function to walk through all elements
  function walkElement(element, path = []) {
    if (!element || typeof element !== 'object' || firstSectPr) return;

    // Check if this element has w:sectPr
    if (element['w:sectPr']) {
      // Debug the section properties before removal
      console.log('[SECTPR-DEBUG] Found section properties:', {
        path: path.join(' > '),
        headerRefs: extractRefs(element['w:sectPr'], 'w:headerReference'),
        footerRefs: extractRefs(element['w:sectPr'], 'w:footerReference')
      });
      firstSectPr = element['w:sectPr'];
      location = { path, element };
      return;
    }

    // Recursively check all properties and array items
    for (const [key, value] of Object.entries(element)) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          walkElement(item, [...path, `${key}[${index}]`]);
        });
      } else if (typeof value === 'object' && value !== null) {
        walkElement(value, [...path, key]);
      }
    }
  }

  // Walk through each top-level element
  for (let i = 0; i < docBodyArray.length && !firstSectPr; i++) {
    walkElement(docBodyArray[i], [`body[${i}]`]);
  }

  if (firstSectPr && location) {
    // Parse the path to find the section
    const bodyIndex = parseInt(location.path[0].match(/body\[(\d+)\]/)?.[1]);
    if (isNaN(bodyIndex)) {
      return null;
    }

    // Navigate to the container of the sectPr
    let container = docBodyArray[bodyIndex];
    for (let i = 1; i < location.path.length - 1; i++) {
      const pathPart = location.path[i];
      const [key, indexStr] = pathPart.split('[');
      const index = indexStr ? parseInt(indexStr) : null;
      
      if (index !== null) {
        container = container[key.replace(']', '')][index];
      } else {
        container = container[key];
      }
      
      if (!container) {
        return null;
      }
    }

    // Debug the section properties before removal
    console.log('[SECTPR-DEBUG] About to remove section properties from:', {
      containerType: Object.keys(container)[0],
      hasDirectSectPr: !!container['w:sectPr'],
      hasPPrSectPr: !!(container['w:pPr'] && container['w:pPr'][0] && container['w:pPr'][0]['w:sectPr']),
      headerRefs: container['w:sectPr'] ? extractRefs(container['w:sectPr'], 'w:headerReference') : []
    });

    // Remove the sectPr
    if (container['w:sectPr']) {
      delete container['w:sectPr'];
    } else if (container['w:pPr'] && container['w:pPr'][0]) {
      delete container['w:pPr'][0]['w:sectPr'];
    }

    return {
      sectPr: firstSectPr,
      type: 'found',
      index: bodyIndex
    };
  }

  return null;
}

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
    if (finalSectPr) {
      console.log('[SECTPR-DEBUG] Found final section properties:', {
        headerRefs: extractRefs(finalSectPr['w:sectPr'], 'w:headerReference'),
        footerRefs: extractRefs(finalSectPr['w:sectPr'], 'w:footerReference')
      });
    }

    const bodyDoc = body.documentObj.find((el) => 'w:document' in el);
    const bodyRelationships = extractRelationships(body.relationshipsXml);
    const bodyContent = bodyDoc['w:document'].find((el) => 'w:body' in el)?.['w:body'] || [];
    const coverRelationships = extractRelationships(coverPage.relationshipsXml);

    // Find and remove the first <w:sectPr>
    const sectPrLoc = findAndRemoveFirstSectPr(coverBody);
    const removedSectPr = sectPrLoc ? sectPrLoc.sectPr : null;

    // Find the first page break in the cover page
    const pageBreakIndex = findFirstPageBreak(coverBody);

    const { relIdMap, newRelationships, mediaFileMap } = processRelationships(coverRelationships, bodyRelationships);

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
          pPrObjectContainer = { 'w:pPr': [{}] };
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
      console.log('[SECTPR-DEBUG] Restored final section properties:', {
        headerRefs: extractRefs(finalSectPr['w:sectPr'], 'w:headerReference'),
        footerRefs: extractRefs(finalSectPr['w:sectPr'], 'w:footerReference')
      });
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