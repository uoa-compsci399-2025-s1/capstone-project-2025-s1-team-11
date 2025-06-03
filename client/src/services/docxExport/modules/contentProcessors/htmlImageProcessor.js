// src/services/docxExport/modules/contentProcessors/htmlImageProcessor.js

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

            // Get dimensions - prioritize style attributes from resizing, then element attributes, then natural size
            let width = imgElement.naturalWidth || 300;
            let height = imgElement.naturalHeight || 200;
            
            // Check for style-based dimensions (from resizing)
            if (imgElement.style.width) {
                const styleWidth = parseFloat(imgElement.style.width);
                if (!isNaN(styleWidth)) {
                    width = styleWidth;
                    // Calculate proportional height if only width is styled
                    if (!imgElement.style.height && imgElement.naturalWidth && imgElement.naturalHeight) {
                        const aspectRatio = imgElement.naturalHeight / imgElement.naturalWidth;
                        height = width * aspectRatio;
                    }
                }
            }
            
            if (imgElement.style.height) {
                const styleHeight = parseFloat(imgElement.style.height);
                if (!isNaN(styleHeight)) {
                    height = styleHeight;
                }
            }
            
            // Fallback to element attributes
            if (imgElement.width && !imgElement.style.width) {
                width = imgElement.width;
            }
            if (imgElement.height && !imgElement.style.height) {
                height = imgElement.height;
            }

            return {
                type: 'image',
                format: format,
                base64: base64Data,
                width: Math.round(width),
                height: Math.round(height),
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