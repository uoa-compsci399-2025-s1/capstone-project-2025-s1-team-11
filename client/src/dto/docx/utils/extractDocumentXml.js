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
  const drawingInstances = []; // NEW: Store all instances with position info

  try {
    // Get the document.xml content
    const documentXml = await zip.file('word/document.xml').async('string');
    const documentJson = parseXmlToJson(documentXml);

    // Process all paragraphs
    const paragraphs = documentJson['w:document']?.['w:body']?.['w:p'];
    const paragraphArray = Array.isArray(paragraphs) ? paragraphs : (paragraphs ? [paragraphs] : []);

    paragraphArray.forEach((paragraph, paragraphIndex) => {
      const runs = paragraph['w:r'];
      const runArray = Array.isArray(runs) ? runs : (runs ? [runs] : []);

      runArray.forEach((run, runIndex) => {
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

              const instanceData = {
                type: 'inline',
                width: widthPt,
                height: heightPt,
                embedId: embedId,
                paragraphIndex,
                runIndex
              };

              // Store in both the legacy map (for backward compatibility) and the new instances array
              drawingMap[embedId] = instanceData;
              drawingInstances.push(instanceData);
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

              const instanceData = {
                type: 'floating',
                width: widthPt,
                height: heightPt,
                embedId: embedId,
                paragraphIndex,
                runIndex,
                position: {
                  horizontalRelative: hRelative,
                  verticalRelative: vRelative,
                  horizontalOffset: hOffset,
                  verticalOffset: vOffset
                },
                wrapping: wrapType
              };

              // Store in both the legacy map (for backward compatibility) and the new instances array
              drawingMap[embedId] = instanceData;
              drawingInstances.push(instanceData);
            }
          }
        }
      });
    });

    return { drawingMap, drawingInstances };
  } catch (error) {
    console.error('Error extracting drawing elements:', error);
    return { drawingMap: {}, drawingInstances: [] };
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
  const { drawingMap, drawingInstances } = await extractDrawingElements(zip);

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
            ...drawingMap[relId] // Add dimension and position data if available
          };
        }
      } catch (error) {
        console.error(`Error extracting image ${target}:`, error);
      }
    }
  }

  return { documentXml, relationships, imageData, drawingInstances };
};