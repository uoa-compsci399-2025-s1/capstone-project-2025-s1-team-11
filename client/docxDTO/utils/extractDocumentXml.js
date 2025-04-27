import JSZip from 'jszip';
import fs from 'fs/promises';
import { parseXmlToJson } from './parseXmlToJson.js';

export const extractDocumentXml = async (filePath) => {
  const data = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(data);

  // Extract main document
  const documentXml = await zip.file('word/document.xml').async('string');

  // ✅ Extract relationships
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

  return { documentXml, relationships };
};