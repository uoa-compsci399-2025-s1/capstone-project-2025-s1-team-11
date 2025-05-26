import JSZip from "jszip";
import { convertLatexToOmml } from '../utils/ommlConverter';

/**
 * Post-process the DOCX to replace text formatting placeholders with actual formatting
 * @param {Blob} docxBlob - The generated DOCX file
 * @returns {Promise<Blob>} - The processed DOCX with text formatting
 */
export async function postProcessTextFormatting(docxBlob) {

    try {
        // Convert blob to arraybuffer
        const arrayBuffer = await docxBlob.arrayBuffer();

        // Load the DOCX file
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Get the main document
        let docXml = await zip.file('word/document.xml').async('string');

        console.log('=== TEXT PROCESSOR DEBUG ===');
        console.log('Document contains §MATH_OMML§:', docXml.includes('§MATH_OMML§'));
        console.log('Count of math markers:', (docXml.match(/§MATH_OMML§/g) || []).length);

        // Debug logging
        //console.log("Document contains §CODE§:", docXml.includes('§CODE§'));
        if (docXml.includes('§CODE§')) {
            const codeIndex = docXml.indexOf('§CODE§');
            console.log("XML around code tag:", docXml.substring(codeIndex - 100, codeIndex + 200));
        }

// First, identify code blocks but PRESERVE nested tags
        let processedXml = docXml;

// Find all code blocks with nested tags
        const codeBlockRegex = /§CODE§(.*?)§\/CODE§/gs;
        let match;

        while ((match = codeBlockRegex.exec(docXml)) !== null) {
            const codeContent = match[1];

            // Instead of stripping nested tags, mark them for special handling
            const preservedContent = codeContent
                .replace(/§BOLD§(.*?)§\/BOLD§/gs, '§CODE_BOLD§$1§/CODE_BOLD§')
                .replace(/§ITALIC§(.*?)§\/ITALIC§/gs, '§CODE_ITALIC§$1§/CODE_ITALIC§')
                .replace(/§UNDERLINE§(.*?)§\/UNDERLINE§/gs, '§CODE_UNDERLINE§$1§/CODE_UNDERLINE§');

            // Replace the original code block with preserved content
            processedXml = processedXml.replace(
                match[0],
                `§CODE§${preservedContent}§/CODE§`
            );
        }

        // Update the XML with the pre-processed code blocks
        docXml = processedXml;

        // Now apply all the formatting replacements
        const replacements = [
            {
                pattern: /§BOLD§([\s\S]*?)§\/BOLD§/g,
                replacement: (match, text) => {
                    return `</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r><w:r><w:t xml:space="preserve">`;
                }
            },
            {
                pattern: /§ITALIC§([\s\S]*?)§\/ITALIC§/g,
                replacement: (match, text) => {
                    return `</w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r><w:r><w:t xml:space="preserve">`;
                }
            },
            {
                pattern: /§UNDERLINE§([\s\S]*?)§\/UNDERLINE§/g,
                replacement: (match, text) => {
                    return `</w:t></w:r><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r><w:r><w:t xml:space="preserve">`;
                }
            },
            {
                pattern: /§CODE§([\s\S]*?)§\/CODE§/g,
                replacement: (match, text) => {
                    // Base code formatting
                    let result = `</w:t></w:r><w:r><w:rPr>
                      <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>
                      <w:sz w:val="22"/>
                      <w:szCs w:val="22"/>
                    </w:rPr><w:t xml:space="preserve">`;

                    // Process text to handle nested formatting while preserving code font
                    let processedText = text
                        // Replace special code formatting markers
                        .replace(/§CODE_BOLD§([\s\S]*?)§\/CODE_BOLD§/g,
                            (m, boldText) => `</w:t></w:r><w:r><w:rPr>
                          <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>
                          <w:sz w:val="22"/>
                          <w:szCs w:val="22"/>
                          <w:b/>
                        </w:rPr><w:t xml:space="preserve">${boldText}</w:t></w:r><w:r><w:rPr>
                          <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>
                          <w:sz w:val="22"/>
                          <w:szCs w:val="22"/>
                        </w:rPr><w:t xml:space="preserve">`)
                        .replace(/§CODE_ITALIC§([\s\S]*?)§\/CODE_ITALIC§/g,
                            (m, italicText) => `</w:t></w:r><w:r><w:rPr>
                          <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>
                          <w:sz w:val="22"/>
                          <w:szCs w:val="22"/>
                          <w:i/>
                        </w:rPr><w:t xml:space="preserve">${italicText}</w:t></w:r><w:r><w:rPr>
                          <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>
                          <w:sz w:val="22"/>
                          <w:szCs w:val="22"/>
                        </w:rPr><w:t xml:space="preserve">`)
                        .replace(/§CODE_UNDERLINE§([\s\S]*?)§\/CODE_UNDERLINE§/g,
                            (m, underlineText) => `</w:t></w:r><w:r><w:rPr>
                          <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>
                          <w:sz w:val="22"/>
                          <w:szCs w:val="22"/>
                          <w:u w:val="single"/>
                        </w:rPr><w:t xml:space="preserve">${underlineText}</w:t></w:r><w:r><w:rPr>
                          <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>
                          <w:sz w:val="22"/>
                          <w:szCs w:val="22"/>
                        </w:rPr><w:t xml:space="preserve">`);

                    // Handle arrow characters specifically
                    processedText = processedText
                        .replace(/←/g, '&#x2190;')  // Left arrow
                        .replace(/→/g, '&#x2192;'); // Right arrow

                    return result + processedText + `</w:t></w:r><w:r><w:t xml:space="preserve">`;
                }
            },
            {
                pattern: /§SUBSCRIPT§([\s\S]*?)§\/SUBSCRIPT§/g,
                replacement: (match, text) => {
                    return `</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r><w:r><w:t xml:space="preserve">`;
                }
            },
            {
                pattern: /§SUPERSCRIPT§([\s\S]*?)§\/SUPERSCRIPT§/g,
                replacement: (match, text) => {
                    return `</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r><w:r><w:t xml:space="preserve">`;
                }
            },
            {
                pattern: /§MATH_INLINE§([\s\S]*?)§\/MATH_INLINE§/g,
                replacement: (match, text) => {
                    // Convert inline LaTeX math to OMML
                    return `</w:t></w:r>
                      <m:oMathPara>
                        <m:oMath>
                          ${convertLatexToOmml(text)}
                        </m:oMath>
                      </m:oMathPara>
                    <w:r><w:t xml:space="preserve">`;
                }
            },
            {
                pattern: /§MATH_DISPLAY§([\s\S]*?)§\/MATH_DISPLAY§/g,
                replacement: (match, text) => {
                    // Convert display LaTeX math to OMML with display style
                    return `</w:t></w:r>
                      <m:oMathPara>
                        <m:oMathParaPr>
                          <m:jc m:val="center"/>
                        </m:oMathParaPr>
                        <m:oMath>
                          ${convertLatexToOmml(text, true)}
                        </m:oMath>
                      </m:oMathPara>
                    <w:r><w:t xml:space="preserve">`;
                }
            },
            {
                pattern: /§MATH_OMML§((?:(?!§\/MATH_OMML§)[\s\S])*)§\/MATH_OMML§/g,
                replacement: (match, ommlXml) => {
                    console.log('=== OMML REPLACEMENT DEBUG ===');
                    console.log('Match found:', match.substring(0, 100) + '...');
                    console.log('OMML XML length:', ommlXml.length);
                    console.log('OMML starts with:', ommlXml.substring(0, 50));

                    // Insert OMML directly without conversion
                    const unescapedXml = ommlXml
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&');

                    return `</w:t></w:r>${unescapedXml}<w:r><w:t xml:space="preserve">`;
                }
            }
        ];

        // Apply replacements
        replacements.forEach(({pattern, replacement}) => {
            docXml = docXml.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (match, attributes, content) => {
                if (pattern.test(content)) {
                    const newContent = content.replace(pattern, replacement);
                    const preserveSpace = attributes.includes('xml:space="preserve"') ? attributes : attributes + ' xml:space="preserve"';
                    return `<w:t${preserveSpace}>${newContent}</w:t>`;
                }
                return match;
            });
        });

        console.log('=== AFTER REPLACEMENTS ===');
        console.log('Document still contains §MATH_OMML§:', docXml.includes('§MATH_OMML§'));
        console.log('Count after replacements:', (docXml.match(/§MATH_OMML§/g) || []).length);

        // Ensure that OMML namespace is declared in the document
        if (docXml.includes('<m:oMath>') && !docXml.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"')) {
            docXml = docXml.replace('<w:document ', '<w:document xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ');
        }

        // Clean up any empty text runs that might have been created
        docXml = docXml.replace(/<w:r><w:t[^>]*><\/w:t><\/w:r>/g, '');

        console.log('=== FINAL XML SAMPLE ===');
        const mathSample = docXml.match(/<m:bar>.*?<\/m:bar>/s);
        if (mathSample) {
            console.log('Sample OMML in final XML:', mathSample[0].substring(0, 200) + '...');
        } else {
            console.log('No OMML found in final XML!');
        }
        console.log('Has math namespace?', docXml.includes('xmlns:m='));

        // Update document.xml
        zip.file('word/document.xml', docXml);

        // Generate new DOCX
        const processedDocx = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        return processedDocx;

    } catch (error) {
        console.error('Error post-processing text formatting:', error);
        return docxBlob; // Return original if error
    }
}