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