// src/services/docxExport/modules/docxtemplaterExport.js

// Re-export all public functions to maintain backward compatibility
export { loadTemplate, loadTemplateAlt } from './modules/loaders/templateLoader.js';
export { createImageModule } from './modules/processors/docxImageProcessor.js';
export { exportExamWithDocxtemplater, exportExamToDocxWithDocxtemplater } from './modules/exporters/docxtemplaterExporter.js';