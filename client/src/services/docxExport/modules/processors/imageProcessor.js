import JSZip from "jszip";
import ImageModule from "docxtemplater-image-module-free";

/**
 * Create the image module configuration
 */
export function createImageModule() {
    const imageOpts = {
        centered: false,
        fileType: "docx",
        getImage: function (tagValue) {
            try {
                // tagValue is the base64 string
                // Convert base64 to binary buffer for browser environment
                const binaryString = atob(tagValue);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            } catch (error) {
                console.error("Error in getImage:", error);
                throw error;
            }
        },
        getSize: function () {
            // Return image dimensions
            // You can customize this based on the tag name
            return [300, 200]; // Default size
        }
    };

    return new ImageModule(imageOpts);
}

/**
 * Process template data to handle images and other rich content
 * @param {Object} templateData - Formatted data from formatExamDataForTemplate
 * @returns {Object} - Processed data ready for docxtemplater
 */
export function processTemplateData(templateData) {
    const processedData = {...templateData};

    // Process exam body items
    if (processedData.examBody) {
        processedData.examBody = processedData.examBody.map(item => {
            let processedItem = {...item};

            // Handle section content with images
            if (item.isSection && item.sectionElements) {
                const sectionImages = {};
                item.sectionElements.forEach((element, index) => {
                    if (element.type === 'image') {
                        const imageKey = `sectionImage_${item.sectionNumber}_${index}`;
                        sectionImages[imageKey] = element.base64;
                        // Replace placeholder in text
                        processedItem.sectionContent = processedItem.sectionContent.replace(
                            `{{image_${index}}}`,
                            `[[IMAGE::${imageKey}]]`
                        );
                    }
                });
                processedItem = {...processedItem, ...sectionImages};
            }

            // Handle question content with images
            if (item.questionElements) {
                const questionImages = {};
                item.questionElements.forEach((element, index) => {
                    if (element.type === 'image') {
                        const imageKey = `questionImage_${item.questionNumber}_${index}`;
                        questionImages[imageKey] = element.base64;
                        // Replace placeholder in text
                        processedItem.questionText = processedItem.questionText.replace(
                            `{{image_${index}}}`,
                            `[[IMAGE::${imageKey}]]`
                        );
                    }
                });
                processedItem = {...processedItem, ...questionImages};
            }

            // Handle answer images
            if (item.answers) {
                processedItem.answers = item.answers.map((answer, answerIndex) => {
                    let processedAnswer = {...answer};
                    if (answer.elements) {
                        const answerImages = {};
                        answer.elements.forEach((element, index) => {
                            if (element.type === 'image') {
                                const imageKey = `answerImage_${item.questionNumber}_${answerIndex}_${index}`;
                                answerImages[imageKey] = element.base64;
                                // Replace placeholder in text
                                processedAnswer.text = processedAnswer.text.replace(
                                    `{{image_${index}}}`,
                                    `[[IMAGE::${imageKey}]]`
                                );
                            }
                        });
                        processedAnswer = {...processedAnswer, ...answerImages};
                    }
                    return processedAnswer;
                });
            }

            return processedItem;
        });
    }

    return processedData;
}

/**
 * Post-process the DOCX to replace image placeholders with actual images
 * @param {Blob} docxBlob - The generated DOCX file
 * @param {Object} processedData - The processed data containing image information
 * @returns {Promise<Blob>} - The processed DOCX with images
 */
export async function postProcessDocxImages(docxBlob, processedData) {
    try {
        // Convert blob to arraybuffer
        const arrayBuffer = await docxBlob.arrayBuffer();

        // Load the DOCX file
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Get the main document
        const docXml = await zip.file('word/document.xml').async('string');

        // Collect all image data from processedData
        const allImages = {};

        // Extract images from exam body
        if (processedData.examBody) {
            processedData.examBody.forEach(item => {
                // First check questionElements for structured image data
                if (item.questionElements) {
                    item.questionElements.forEach((element, index) => {
                        if (element.type === 'image') {
                            const imageKey = `questionImage_${item.questionNumber}_${index}`;
                            allImages[imageKey] = {
                                base64: element.base64,
                                width: element.width,
                                height: element.height,
                                mimeType: element.mimeType,
                                filename: element.filename
                            };
                        }
                    });
                }

                // Then check for direct image properties (fallback)
                Object.keys(item).forEach(key => {
                    if (key.includes('Image') && typeof item[key] === 'string' && item[key].length > 100) {
                        if (!allImages[key]) {
                            allImages[key] = {
                                base64: item[key],
                                width: 300,  // Default width
                                height: 200  // Default height
                            };
                        }
                    }
                });

                // Check section elements
                if (item.sectionElements) {
                    item.sectionElements.forEach((element, index) => {
                        if (element.type === 'image') {
                            const imageKey = `sectionImage_${item.sectionNumber}_${index}`;
                            allImages[imageKey] = {
                                base64: element.base64,
                                width: element.width,
                                height: element.height,
                                mimeType: element.mimeType,
                                filename: element.filename
                            };
                        }
                    });
                }

                // Check answers for images
                if (item.answers) {
                    item.answers.forEach((answer, answerIndex) => {
                        if (answer.elements) {
                            answer.elements.forEach((element, index) => {
                                if (element.type === 'image') {
                                    const imageKey = `answerImage_${item.questionNumber}_${answerIndex}_${index}`;
                                    allImages[imageKey] = {
                                        base64: element.base64,
                                        width: element.width,
                                        height: element.height,
                                        mimeType: element.mimeType,
                                        filename: element.filename
                                    };
                                }
                            });
                        }

                        // Fallback for direct properties
                        Object.keys(answer).forEach(key => {
                            if (key.includes('Image') && typeof answer[key] === 'string' && answer[key].length > 100) {
                                if (!allImages[key]) {
                                    allImages[key] = {
                                        base64: answer[key],
                                        width: 300,
                                        height: 200
                                    };
                                }
                            }
                        });
                    });
                }
            });
        }

        // Find all image placeholders
        const placeholderRegex = /\[\[IMAGE::([^\]]+)\]\]/g;
        let match;
        const imagesToAdd = [];
        let imageId = 100; // Start with a high ID to avoid conflicts

        while ((match = placeholderRegex.exec(docXml)) !== null) {
            const imageKey = match[1];
            const imageData = allImages[imageKey];

            if (imageData) {
                const rId = `rId${500 + imageId}`;
                imagesToAdd.push({
                    key: imageKey,
                    placeholder: match[0],
                    data: imageData.base64 || imageData,
                    width: imageData.width || 300,
                    height: imageData.height || 200,
                    mimeType: imageData.mimeType || 'image/png',
                    id: imageId,
                    rId: rId,
                    filename: `image${imageId}.${imageData.mimeType ? imageData.mimeType.split('/')[1] : 'png'}`
                });
                imageId++;
            }
        }

        // If no images to add, return original
        if (imagesToAdd.length === 0) {
            return docxBlob;
        }

        // Replace placeholders with image XML
        let modifiedXml = docXml;

        for (const img of imagesToAdd) {
            // Convert dimensions to EMU (English Metric Units)
            // Note: the dimensions from extractDocumentXml are already in points
            // 1 point = 12700 EMU
            const widthEmu = Math.round(img.width * 12700);
            const heightEmu = Math.round(img.height * 12700);

            // Create the image XML
            const imageXml = `<w:drawing>
<wp:inline distT="0" distB="0" distL="0" distR="0">
<wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
<wp:effectExtent l="0" t="0" r="0" b="0"/>
<wp:docPr id="${img.id}" name="Picture ${img.id}"/>
<wp:cNvGraphicFramePr>
<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
</wp:cNvGraphicFramePr>
<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:nvPicPr>
<pic:cNvPr id="${img.id}" name="Picture ${img.id}"/>
<pic:cNvPicPr/>
</pic:nvPicPr>
<pic:blipFill>
<a:blip r:embed="${img.rId}"/>
<a:stretch>
<a:fillRect/>
</a:stretch>
</pic:blipFill>
<pic:spPr>
<a:xfrm>
<a:off x="0" y="0"/>
<a:ext cx="${widthEmu}" cy="${heightEmu}"/>
</a:xfrm>
<a:prstGeom prst="rect">
<a:avLst/>
</a:prstGeom>
</pic:spPr>
</pic:pic>
</a:graphicData>
</a:graphic>
</wp:inline>
</w:drawing>`;

            // Replace the placeholder with the image
            const textRunRegex = new RegExp(
                `(<w:t[^>]*>)([^<]*)(\\[\\[IMAGE::${img.key}\\]\\])([^<]*)(</w:t>)`,
                'g'
            );

            modifiedXml = modifiedXml.replace(textRunRegex, (match, startTag, beforeText, placeholder, afterText, endTag) => {
                // Split the text run and insert the image
                let replacement = '';
                if (beforeText) {
                    replacement += `${startTag}${beforeText}${endTag}</w:r><w:r>`;
                }
                replacement += imageXml;
                if (afterText) {
                    replacement += `</w:r><w:r>${startTag}${afterText}${endTag}`;
                } else {
                    replacement += '</w:r><w:r><w:t></w:t>';
                }
                return replacement;
            });
        }

        // Update document.xml
        zip.file('word/document.xml', modifiedXml);

        // Add images to media folder and update relationships
        const relsXml = await zip.file('word/_rels/document.xml.rels').async('string');
        let modifiedRels = relsXml;

        // Ensure media folder exists
        if (!zip.folder('word/media')) {
            zip.folder('word/media');
        }

        for (const img of imagesToAdd) {
            // Extract base64 data (handle both data URL and raw base64)
            let base64Data = img.data;
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
            }

            // Convert base64 to binary
            const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            // Add image to media folder
            zip.file(`word/media/${img.filename}`, imageBuffer);

            // Add relationship (insert before closing tag)
            const relXml = `<Relationship Id="${img.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${img.filename}"/>`;
            modifiedRels = modifiedRels.replace('</Relationships>', `${relXml}\n</Relationships>`);
        }

        // Update relationships file
        zip.file('word/_rels/document.xml.rels', modifiedRels);

        // Also need to update content types for various image formats
        const contentTypesXml = await zip.file('[Content_Types].xml').async('string');
        let modifiedContentTypes = contentTypesXml;

        // Add image content types if not present
        const imageTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'bmp': 'image/bmp'
        };

        for (const [ext, contentType] of Object.entries(imageTypes)) {
            if (!modifiedContentTypes.includes(`Extension="${ext}"`)) {
                const typeXml = `<Default Extension="${ext}" ContentType="${contentType}"/>`;
                modifiedContentTypes = modifiedContentTypes.replace('</Types>', `${typeXml}\n</Types>`);
            }
        }

        zip.file('[Content_Types].xml', modifiedContentTypes);

        // Generate new DOCX
        const processedDocx = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        return processedDocx;

    } catch (error) {
        console.error('Error post-processing images:', error);
        console.error('Error stack:', error.stack);
        return docxBlob; // Return original if error
    }
}