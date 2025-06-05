import { XMLParser } from 'fast-xml-parser';

export const parseXmlToJson = (xmlString) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    ignoreDeclaration: true,
    trimValues: false
  });

  const result = parser.parse(xmlString);

  return result;
};