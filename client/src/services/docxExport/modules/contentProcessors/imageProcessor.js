// src/services/docxExport/modules/contentProcessors/imageProcessor.js

/**
 * Processes image elements for DOCX export
 * Handles inline base64 images and converts them to a format suitable for docxtemplater
 */

/**
 * Process an image element and extract its data
 * @param {HTMLImageElement} imgElement - The image element to process
 * @returns {Object} Processed image data ready for DOCX insertion
 */
export function processImage(imgElement) {
    try {
        const src = imgElement.src;

        if (!src) {
            console.warn('Image element has no source');
            return null;
        }

        // Handle base64 encoded images
        if (src.startsWith('data:image')) {
            const base64Match = src.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);

            if (!base64Match) {
                console.error('Invalid base64 image format');
                return null;
            }

            const [, format, base64Data] = base64Match;

            // Get dimensions from the element or use defaults
            const width = imgElement.width || imgElement.naturalWidth || 300;
            const height = imgElement.height || imgElement.naturalHeight || 200;

            return {
                type: 'image',
                format: format,
                base64: base64Data,
                width: width,
                height: height,
                alt: imgElement.alt || 'Image'
            };
        }

        // Handle external images (if needed in the future)
        // For now, we'll just log a warning
        console.warn('External images are not currently supported:', src);
        return null;

    } catch (error) {
        console.error('Error processing image:', error);
        return null;
    }
}

/**
 * Convert processed image data to a format suitable for docxtemplater
 * @param {Object} imageData - Processed image data
 * @returns {Object} Image data formatted for docxtemplater
 */
export function formatImageForTemplate(imageData) {
    if (!imageData || imageData.type !== 'image') {
        return null;
    }

    return {
        type: 'image',
        data: imageData.base64,
        extension: imageData.format || 'png',
        width: Math.min(imageData.width, 600), // Max width to fit in document
        height: Math.min(imageData.height, 800) // Max height to fit in document
    };
}

/**
 * Process multiple images in a content block
 * @param {NodeList|Array} imageElements - Collection of image elements
 * @returns {Array} Array of processed image data
 */
export function processImages(imageElements) {
    const processedImages = [];

    for (const img of imageElements) {
        const imageData = processImage(img);
        if (imageData) {
            processedImages.push(imageData);
        }
    }

    return processedImages;
}