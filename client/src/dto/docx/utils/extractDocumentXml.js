import JSZip from 'jszip';
//import fs from 'fs/promises';
import { parseXmlToJson } from './parseXmlToJson.js';

/**
 * Helper function to extract image dimensions and positioning information
 * @param {Object} zip - JSZip object containing the document
 * @param {String} relationships - Object mapping relationship IDs to targets
 * @returns {Promise<Object>} - Object containing drawing elements with their information
 */
const extractDrawingElements = async (zip) => {
  const drawingMap = {};

  try {
    // Get the document.xml content
    const documentXml = await zip.file('word/document.xml').async('string');
    const documentJson = parseXmlToJson(documentXml);

    // Process all paragraphs
    const paragraphs = documentJson['w:document']?.['w:body']?.['w:p'];
    const paragraphArray = Array.isArray(paragraphs) ? paragraphs : (paragraphs ? [paragraphs] : []);

    paragraphArray.forEach(paragraph => {
      const runs = paragraph['w:r'];
      const runArray = Array.isArray(runs) ? runs : (runs ? [runs] : []);

      runArray.forEach(run => {
        if (run['w:drawing']) {
          // Process inline images
          if (run['w:drawing']['wp:inline']) {
            const inline = run['w:drawing']['wp:inline'];
            const blip = inline?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
            const embedId = blip?.['@_r:embed'];

            if (embedId) {
              // Extract dimensions from extent
              const extent = inline['wp:extent'];
              const widthEmu = extent?.['@_cx'] ? parseInt(extent['@_cx']) : 0;
              const heightEmu = extent?.['@_cy'] ? parseInt(extent['@_cy']) : 0;

              // Convert EMU to points (1 inch = 72 points = 914400 EMU)
              const widthPt = widthEmu / 12700; // 914400/72 = 12700
              const heightPt = heightEmu / 12700;

              drawingMap[embedId] = {
                type: 'inline',
                width: widthPt,
                height: heightPt,
                embedId: embedId
              };
            }
          }

          // Process floating images
          if (run['w:drawing']['wp:anchor']) {
            const anchor = run['w:drawing']['wp:anchor'];
            const blip = anchor?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
            const embedId = blip?.['@_r:embed'];

            if (embedId) {
              // Extract dimensions from extent
              const extent = anchor['wp:extent'];
              const widthEmu = extent?.['@_cx'] ? parseInt(extent['@_cx']) : 0;
              const heightEmu = extent?.['@_cy'] ? parseInt(extent['@_cy']) : 0;

              // Convert EMU to points
              const widthPt = widthEmu / 12700;
              const heightPt = heightEmu / 12700;

              // Get positioning information
              const positionH = anchor['wp:positionH'];
              const positionV = anchor['wp:positionV'];

              const hRelative = positionH?.['@_relativeFrom'] || 'column';
              const vRelative = positionV?.['@_relativeFrom'] || 'paragraph';

              // Get offset values
              const hOffset = positionH?.['wp:posOffset'] ? parseInt(positionH['wp:posOffset']) / 12700 : 0;
              const vOffset = positionV?.['wp:posOffset'] ? parseInt(positionV['wp:posOffset']) / 12700 : 0;

              // Get wrapping info
              const wrapType = anchor['wp:wrapNone'] ? 'none' :
                  anchor['wp:wrapSquare'] ? 'square' :
                      anchor['wp:wrapTight'] ? 'tight' :
                          anchor['wp:wrapThrough'] ? 'through' : 'inline';

              drawingMap[embedId] = {
                type: 'floating',
                width: widthPt,
                height: heightPt,
                embedId: embedId,
                position: {
                  horizontalRelative: hRelative,
                  verticalRelative: vRelative,
                  horizontalOffset: hOffset,
                  verticalOffset: vOffset
                },
                wrapping: wrapType
              };
            }
          }
        }
      });
    });

    return drawingMap;
  } catch (error) {
    console.error('Error extracting drawing elements:', error);
    return {};
  }
};

/**
 * Extract math elements with their original XML from the document
 * @param {Object} zip - JSZip object containing the document
 * @param {string} documentXml - The document XML string
 * @returns {Array} - Array of math elements with original XML preserved
 */
const extractMathElements = async (zip, documentXml) => {
  const mathElements = [];
  let mathIndex = 0;

  try {
    // Extract all OMML elements from the document XML
    const omathRegex = /<m:oMath[^>]*>.*?<\/m:oMath>/gs;
    const omathParaRegex = /<m:oMathPara[^>]*>.*?<\/m:oMathPara>/gs;

    let match;

    // Extract standalone oMath elements
    while ((match = omathRegex.exec(documentXml)) !== null) {
      mathElements.push({
        id: `math-${mathIndex++}`,
        type: 'oMath',
        originalXml: match[0],
        isBlockMath: false,
        position: match.index
      });
    }

    // Reset regex lastIndex and extract oMathPara elements
    omathParaRegex.lastIndex = 0;
    while ((match = omathParaRegex.exec(documentXml)) !== null) {
      mathElements.push({
        id: `math-${mathIndex++}`,
        type: 'oMathPara',
        originalXml: match[0],
        isBlockMath: true,
        position: match.index
      });
    }

    // Sort by position in document to maintain correct order
    mathElements.sort((a, b) => a.position - b.position);

    console.log(`Extracted ${mathElements.length} math elements from document`);
    mathElements.forEach((elem, idx) => {
      console.log(`Math ${idx}: ${elem.type} at position ${elem.position}, XML length: ${elem.originalXml.length}`);
    });

    return mathElements;
  } catch (error) {
    console.error('Error extracting math elements:', error);
    return [];
  }
};

export const extractDocumentXml = async (file) => {
  //const data = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(file);

  // Extract main document
  const documentXml = await zip.file('word/document.xml').async('string');

  // Extract relationships
  let relationships = {};
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (relsFile) {
    const relsXml = await relsFile.async('string');
    const relsJson = parseXmlToJson(relsXml);

    const relsArray = relsJson?.['Relationships']?.['Relationship'];

    if (Array.isArray(relsArray)) {
      for (const rel of relsArray) {
        relationships[rel['@_Id']] = rel['@_Target'];
      }
    } else if (relsArray) {
      relationships[relsArray['@_Id']] = relsArray['@_Target'];
    }
  }

  // Extract drawing elements with positioning and dimension info
  const drawingElements = await extractDrawingElements(zip);

  // Extract math elements with original XML preserved
  const mathElements = await extractMathElements(zip, documentXml);

  // Extract images as base64
  const imageData = {};
  for (const relId in relationships) {
    const target = relationships[relId];
    if (target.startsWith('media/')) {
      try {
        // Path in the zip file
        const imagePath = `word/${target}`;
        const imageFile = zip.file(imagePath);

        if (imageFile) {
          // Get image as ArrayBuffer (browser-compatible)
          const imageArrayBuffer = await imageFile.async('arraybuffer');

          const base64Image = btoa(
              Array.from(new Uint8Array(imageArrayBuffer))
                  .map(b => String.fromCharCode(b))
                  .join('')
          );

          // Determine mime type based on file extension
          const fileExt = target.split('.').pop().toLowerCase();
          let mimeType = 'image/jpeg'; // Default

          if (fileExt === 'png') mimeType = 'image/png';
          else if (fileExt === 'gif') mimeType = 'image/gif';
          else if (fileExt === 'svg') mimeType = 'image/svg+xml';
          else if (fileExt === 'webp') mimeType = 'image/webp';

          // Store the data URL and image properties
          imageData[relId] = {
            dataUrl: `data:${mimeType};base64,${base64Image}`,
            mimeType: mimeType,
            filename: target.split('/').pop(),
            ...drawingElements[relId] // Add dimension and position data if available
          };
        }
      } catch (error) {
        console.error(`Error extracting image ${target}:`, error);
      }
    }
  }

  return { documentXml, relationships, imageData, mathElements };
};