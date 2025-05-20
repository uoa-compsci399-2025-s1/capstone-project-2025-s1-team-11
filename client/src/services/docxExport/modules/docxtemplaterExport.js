// src/services/docxExport/modules/docxtemplaterExport.js

// Re-export all public functions to maintain backward compatibility
export { loadTemplate, loadTemplateAlt } from './loaders/templateLoader';
export { createImageModule } from './processors/imageProcessor';
export { exportExamWithDocxtemplater, exportExamToDocxWithDocxtemplater } from './exporters/docxtemplaterExporter';