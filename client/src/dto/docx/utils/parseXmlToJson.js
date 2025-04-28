import { XMLParser } from 'fast-xml-parser';

export const parseXmlToJson = (xmlString) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    ignoreDeclaration: true,
  });
  return parser.parse(xmlString);
};