import JSZip from "jszip";

/**
 * Insert page breaks into the document
 * @param {Blob} docxBlob - The generated DOCX file
 * @returns {Promise<Blob>} - The processed DOCX with page breaks
 */
export async function insertPageBreaks(docxBlob) {
    try {
        const arrayBuffer = await docxBlob.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        let docXml = await zip.file('word/document.xml').async('string');

        // Replace page break markers with actual Word XML
        const pageBreakXml = '<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>';
        docXml = docXml.replace(/{PAGEBREAK}/g, pageBreakXml);

        zip.file('word/document.xml', docXml);

        return await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
    } catch (error) {
        console.error('Error inserting page breaks:', error);
        return docxBlob; // Return original if error
    }
}

/**
 * Checks if an element contains any type of page break
 */
export function findPageBreakType(element) {
    if (!element || typeof element !== 'object') return null;

    // Check for explicit page break
    if ('w:br' in element && element[':@']?.['@_w:type'] === 'page') {
        return 'explicit';
    }

    // Check for pageBreakBefore
    if ('w:pageBreakBefore' in element) {
        return 'before';
    }

    // Check for last rendered page break
    if ('w:lastRenderedPageBreak' in element) {
        return 'rendered';
    }

    // Check for section break
    if ('w:sectPr' in element) {
        const sectPr = element['w:sectPr'];
        // Check for explicit next page type
        if (Array.isArray(sectPr) && sectPr[0]?.['w:type']?.[0]?.[':@']?.['@_w:val'] === 'nextPage') {
            return 'section';
        }
        // Any section break implies a page break
        return 'section';
    }

    // Recursively check nested elements
    for (const value of Object.values(element)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                const result = findPageBreakType(item);
                if (result) return result;
            }
        } else if (typeof value === 'object' && value !== null) {
            const result = findPageBreakType(value);
            if (result) return result;
        }
    }

    return null;
}

/**
 * Finds the index of the first page break in the document body
 */
export function findFirstPageBreak(documentBody) {
    for (let i = 0; i < documentBody.length; i++) {
        const element = documentBody[i];
        if ('w:p' in element && findPageBreakType(element)) {
            return i;
        }
    }
    return -1;
}

export function isPageBreakSameAsSectPr(sectPrLoc, pageBreakIndex) {
    if (!sectPrLoc || pageBreakIndex === -1) return false;
    return sectPrLoc.index === pageBreakIndex;
}