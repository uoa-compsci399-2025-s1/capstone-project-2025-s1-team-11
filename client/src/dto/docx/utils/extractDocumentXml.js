import JSZip from 'jszip';
//import fs from 'fs/promises';
import { parseXmlToJson } from './parseXmlToJson.js';

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
          // Get image as base64 with nodebuffer (not browser compatible)
          // const imageBuffer = await imageFile.async('nodebuffer');
          // const base64Image = imageBuffer.toString('base64');

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

          // Store the data URL
          imageData[relId] = `data:${mimeType};base64,${base64Image}`;
        }
      } catch (error) {
        console.error(`Error extracting image ${target}:`, error);
      }
    }
  }

  return { documentXml, relationships, imageData };
};