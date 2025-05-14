// src/services/docxExport/modules/contentProcessors/index.js

export { processImage, formatImageForTemplate, processImages } from './imageProcessor';
export { parseHtmlContent, extractTextFromHtml, containsImages } from './htmlParser';

// Future exports will go here
// export { processMath } from './mathProcessor';
// export { formatText } from './textFormatter';
// export { processCodeBlock } from './codeBlockProcessor';