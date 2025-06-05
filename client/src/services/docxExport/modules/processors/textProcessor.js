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

                    // FIXED: Handle arrow characters specifically - preserve them instead of encoding
                    processedText = processedText
                        .replace(/←/g, '←')  // Keep left arrow as-is
                        .replace(/→/g, '→')  // Keep right arrow as-is
                        .replace(/↑/g, '↑')  // Keep up arrow as-is
                        .replace(/↓/g, '↓'); // Keep down arrow as-is

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
                    // Function to decode all HTML entities properly
                    const decodeHtmlEntities = (text) => {
                        return text
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&apos;/g, "'")
                            .replace(/&amp;/g, '&'); // Must be last to avoid double-decoding
                    };
                    
                    // First pass: decode HTML entities
                    let unescapedXml = decodeHtmlEntities(ommlXml);
                    
                    // Check if still escaped (double-escaped case)
                    if (unescapedXml.includes('&lt;') || unescapedXml.includes('&gt;') || unescapedXml.includes('&quot;')) {
                        unescapedXml = decodeHtmlEntities(unescapedXml);
                    }

                    // Check if the XML is already a complete <m:oMath> element
                    let result;
                    if (unescapedXml.trim().startsWith('<m:oMath')) {
                        // Already complete OMML, just insert it
                        result = `</w:t></w:r>${unescapedXml}<w:r><w:t xml:space="preserve">`;
                    } else {
                        // Partial OMML content, wrap in m:oMath
                        result = `</w:t></w:r><m:oMath>${unescapedXml}</m:oMath><w:r><w:t xml:space="preserve">`;
                    }
                    
                    return result;
                }
            },
            {
                pattern: /§MATH_OMML_BLOCK§((?:(?!§\/MATH_OMML_BLOCK§)[\s\S])*)§\/MATH_OMML_BLOCK§/g,
                replacement: (match, ommlXml) => {
                    
                    // Improved unescaping - handle both single and double escaping
                    let unescapedXml = ommlXml;
                    
                    // Function to decode all HTML entities properly
                    const decodeHtmlEntities = (text) => {
                        return text
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&apos;/g, "'")
                            .replace(/&amp;/g, '&'); // Must be last to avoid double-decoding
                    };
                    
                    // First pass: decode HTML entities
                    unescapedXml = decodeHtmlEntities(unescapedXml);
                    
                    // Check if still escaped (double-escaped case)
                    if (unescapedXml.includes('&lt;') || unescapedXml.includes('&gt;') || unescapedXml.includes('&quot;')) {
                        unescapedXml = decodeHtmlEntities(unescapedXml);
                    }

                    // Check if the XML is already a complete block structure
                    let result;
                    if (unescapedXml.trim().startsWith('<m:oMathParaPr') || unescapedXml.trim().startsWith('<m:jc')) {
                        // Already contains paragraph properties, wrap in m:oMathPara
                        result = `</w:t></w:r>
                     <m:oMathPara>
                       ${unescapedXml}
                     </m:oMathPara>
                   <w:r><w:t xml:space="preserve">`;
                    } else if (unescapedXml.trim().startsWith('<m:oMath')) {
                        // Complete oMath element, add paragraph wrapper
                        result = `</w:t></w:r>
                     <m:oMathPara>
                       <m:oMathParaPr>
                         <m:jc m:val="left"/>
                       </m:oMathParaPr>
                       ${unescapedXml}
                     </m:oMathPara>
                   <w:r><w:t xml:space="preserve">`;
                    } else {
                        // Partial content, wrap completely
                        result = `</w:t></w:r>
                     <m:oMathPara>
                       <m:oMathParaPr>
                         <m:jc m:val="left"/>
                       </m:oMathParaPr>
                       <m:oMath>${unescapedXml}</m:oMath>
                     </m:oMathPara>
                   <w:r><w:t xml:space="preserve">`;
                    }
                   
                    return result;
                }
            }
        ];

        // Apply replacements - first pass: process individual text nodes
        replacements.forEach(({pattern, replacement}) => {
            const originalDocXml = docXml;
            docXml = docXml.replace(/<w:t([^>]*)>([\s\S]*?)<\/w:t>/g, (match, attributes, content) => {
                if (pattern.test(content)) {
                    const newContent = content.replace(pattern, replacement);
                    
                    // FIXED: Handle attributes more carefully to avoid missing spaces
                    let finalAttributes = attributes ? attributes.trim() : '';
                    
                    // Ensure xml:space="preserve" is present
                    if (!finalAttributes.includes('xml:space="preserve"')) {
                        if (finalAttributes) {
                            // Add space if there are existing attributes
                            finalAttributes = finalAttributes + ' xml:space="preserve"';
                        } else {
                            // Start with space for clean attribute format
                            finalAttributes = ' xml:space="preserve"';
                        }
                    }
                    
                    // Ensure finalAttributes always starts with a space for proper XML syntax
                    if (finalAttributes && !finalAttributes.startsWith(' ')) {
                        finalAttributes = ' ' + finalAttributes;
                    }
                    
                    const result = `<w:t${finalAttributes}>${newContent}</w:t>`;
                    
                    // Validate the result doesn't have malformed attributes
                    if (result.includes('<w:txml:') || result.includes('<w:t/>') || result.match(/<w:t[^>\s]/)) {
                        // Fallback: construct a safe version
                        return `<w:t xml:space="preserve">${newContent}</w:t>`;
                    }
                    
                    return result;
                }
                return match;
            });
            
            // Document was processed
        });

        // Apply replacements - second pass: process content that might span multiple paragraphs
        // This handles cases where math markers might be split across text nodes
        replacements.forEach(({pattern, replacement}) => {
            if (pattern.test(docXml)) {
                docXml = docXml.replace(pattern, (match, ...args) => {
                    return replacement(match, ...args);
                });
            }
        });

        // FIXED: Also handle arrow characters in regular text (not just code blocks)
        docXml = docXml.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (match, attributes, content) => {
            // Preserve arrows in regular text by ensuring they're not encoded
            const processedContent = content
                .replace(/&lt;/g, '←')   // In case arrows got encoded as &lt;
                .replace(/&gt;/g, '→')   // In case arrows got encoded as &gt;
                .replace(/&#x2190;/g, '←')  // Decode left arrow
                .replace(/&#x2192;/g, '→')  // Decode right arrow
                .replace(/&#x2191;/g, '↑')  // Decode up arrow
                .replace(/&#x2193;/g, '↓'); // Decode down arrow

            return `<w:t${attributes}>${processedContent}</w:t>`;
        });

        // Ensure that OMML namespace is declared in the document
        if (docXml.includes('<m:oMath>') && !docXml.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"')) {
            docXml = docXml.replace('<w:document ', '<w:document xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ');
        }

        // Clean up any empty text runs that might have been created
        docXml = docXml.replace(/<w:r><w:t[^>]*><\/w:t><\/w:r>/g, '');

        // CLEANUP: Fix malformed w:t tags that could cause XML parsing errors
        docXml = docXml.replace(/<w:t\/\s+([^>]*?)>(.*?)<\/w:t>/g, '<w:t $1>$2</w:t>');
        docXml = docXml.replace(/<w:t\s*\/>/g, '<w:t></w:t>'); // Convert empty self-closing to regular empty tags

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