// client/docxDTO/utils/extractDocumentXml.js

import JSZip from 'jszip';
import { parseXmlToJson } from './parseXmlToJson.js';

// Image optimization settings
const IMAGE_OPTIMIZATION = {
  threshold: 40000,     // 50KB - when to optimize
  quality: 0.8,         // 80% - compression level only
  format: 'image/jpeg'  // Output format for compression
};

/**
 * Optimize large images to reduce file size while maintaining dimensions
 * @param {ArrayBuffer} imageArrayBuffer - Original image data
 * @param {string} mimeType - Original image MIME type
 * @returns {Promise<ArrayBuffer>} - Optimized image data
 */
const optimizeImage = async (imageArrayBuffer, mimeType) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a blob from the array buffer
      const blob = new Blob([imageArrayBuffer], { type: mimeType });

      // Create an image element
      const img = new Image();

      img.onload = () => {
        // Create a canvas with the same dimensions as the original
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        // Clear canvas with transparent background for PNG images
        if (mimeType === 'image/png') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);

        // Determine output format based on original type
        let outputFormat = mimeType;
        let quality = IMAGE_OPTIMIZATION.quality;

        // Only convert to JPEG if original is JPEG or we're sure it has no transparency
        if (mimeType === 'image/jpeg') {
          outputFormat = IMAGE_OPTIMIZATION.format;
        } else if (mimeType === 'image/png') {
          // Keep PNG format to preserve transparency/shadows
          outputFormat = 'image/png';
          // PNG doesn't use quality parameter, but we can try to compress it
          quality = undefined;
        }

        // Convert to optimized format
        canvas.toBlob((optimizedBlob) => {
          if (optimizedBlob) {
            // Convert blob back to array buffer
            optimizedBlob.arrayBuffer().then(resolve).catch(reject);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        }, outputFormat, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = URL.createObjectURL(blob);

    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Helper function to extract image dimensions and positioning information
 * @param {Object} zip - JSZip object containing the document
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
    // First, extract all oMathPara elements (block math)
    const omathParaRegex = /<m:oMathPara[^>]*>(.*?)<\/m:oMathPara>/gs;
    let match;

    console.log('Extracting oMathPara elements (block math)...');
    while ((match = omathParaRegex.exec(documentXml)) !== null) {
      const fullParaXml = match[0];
      const paraContent = match[1];
      
      console.log(`Extracted block math ${mathIndex}: ${paraContent.substring(0, 50)}...`);
      
      mathElements.push({
        id: `math-${mathIndex++}`,
        type: 'oMathPara',
        originalXml: paraContent, // Store the complete content including oMathParaPr and oMath
        isBlockMath: true,
        position: match.index
      });
    }

    // Then, extract standalone oMath elements (inline math) that are NOT inside oMathPara
    // We need to be careful not to extract oMath elements that are already part of oMathPara
    const omathRegex = /<m:oMath[^>]*>(.*?)<\/m:oMath>/gs;
    const allOmathMatches = [];
    
    // Collect all oMath matches
    omathRegex.lastIndex = 0;
    while ((match = omathRegex.exec(documentXml)) !== null) {
      allOmathMatches.push({
        fullMatch: match[0],
        innerContent: match[1],
        position: match.index,
        endPosition: match.index + match[0].length
      });
    }

    // Collect all oMathPara ranges to exclude nested oMath
    const omathParaRanges = [];
    omathParaRegex.lastIndex = 0;
    while ((match = omathParaRegex.exec(documentXml)) !== null) {
      omathParaRanges.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }

    console.log('Extracting standalone oMath elements (inline math)...');
    // Filter out oMath elements that are inside oMathPara
    allOmathMatches.forEach(omathMatch => {
      const isInsideParaRange = omathParaRanges.some(paraRange => 
        omathMatch.position >= paraRange.start && omathMatch.endPosition <= paraRange.end
      );

      if (!isInsideParaRange) {
        // This is a standalone oMath (inline math)
        console.log(`Extracted inline math ${mathIndex}: ${omathMatch.innerContent.substring(0, 50)}...`);
        
        mathElements.push({
          id: `math-${mathIndex++}`,
          type: 'oMath',
          originalXml: omathMatch.fullMatch, // Store the complete oMath element including tags
          isBlockMath: false,
          position: omathMatch.position
        });
      }
    });

    // Sort by position in document to maintain correct order
    mathElements.sort((a, b) => a.position - b.position);

    console.log(`Total math elements extracted: ${mathElements.length}`);
    console.log('Math elements:', mathElements.map(m => ({ id: m.id, type: m.type, isBlock: m.isBlockMath })));

    return mathElements;
  } catch (error) {
    console.error('Error extracting math elements:', error);
    return [];
  }
};

export const extractDocumentXml = async (file) => {
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
          let imageArrayBuffer = await imageFile.async('arraybuffer');

          // Determine mime type based on file extension
          const fileExt = target.split('.').pop().toLowerCase();
          let mimeType = 'image/jpeg'; // Default

          if (fileExt === 'png') mimeType = 'image/png';
          else if (fileExt === 'gif') mimeType = 'image/gif';
          else if (fileExt === 'svg') mimeType = 'image/svg+xml';
          else if (fileExt === 'webp') mimeType = 'image/webp';

          // Optimize large images
          if (imageArrayBuffer.byteLength > IMAGE_OPTIMIZATION.threshold) {
            try {
              const originalMimeType = mimeType;
              imageArrayBuffer = await optimizeImage(imageArrayBuffer, mimeType);
              // Only update mime type if we actually converted to JPEG
              if (originalMimeType === 'image/jpeg') {
                mimeType = IMAGE_OPTIMIZATION.format;
              }
              // For PNG, mimeType stays as 'image/png'
            } catch  {
              // Continue with original image if optimization fails
            }
          }

          const base64Image = btoa(
              Array.from(new Uint8Array(imageArrayBuffer))
                  .map(b => String.fromCharCode(b))
                  .join('')
          );

          // Store the data URL and image properties
          imageData[relId] = {
            dataUrl: `data:${mimeType};base64,${base64Image}`,
            mimeType: mimeType,
            filename: target.split('/').pop(),
            ...drawingMap[relId] // Add dimension and position data if available
          };
        }
      } catch  {
        // Handle error silently
      }
    }
  }

  return { documentXml, relationships, imageData,  mathElements, drawingInstances };
};