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
        console.log('Document XML length:', docXml.length);
        
        // Check if document contains math markers
        const mathMarkerRegex = /§MATH_OMML[^§]*§/g;
        const mathMarkers = docXml.match(mathMarkerRegex);
        console.log('Math markers found in document:', mathMarkers ? mathMarkers.length : 0);
        if (mathMarkers) {
            console.log('First few math markers:', mathMarkers.slice(0, 3));
        }
        
        // Check for math placeholders
        const mathPlaceholderRegex = /\[math:[^\]]+\]/g;
        const mathPlaceholders = docXml.match(mathPlaceholderRegex);
        console.log('Math placeholders found in document:', mathPlaceholders ? mathPlaceholders.length : 0);
        if (mathPlaceholders) {
            console.log('Math placeholders:', mathPlaceholders);
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
                    console.log('Processing MATH_OMML marker:', match.substring(0, 100) + '...');
                    
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
                        console.log('Double-escaped inline content detected, unescaping again...');
                        unescapedXml = decodeHtmlEntities(unescapedXml);
                    }

                    console.log('Unescaped OMML XML (inline):', unescapedXml.substring(0, 200) + '...');

                    // Check if the XML is already a complete <m:oMath> element
                    let result;
                    if (unescapedXml.trim().startsWith('<m:oMath')) {
                        // Already complete OMML, just insert it
                        result = `</w:t></w:r>${unescapedXml}<w:r><w:t xml:space="preserve">`;
                        console.log('Using complete oMath structure');
                    } else {
                        // Partial OMML content, wrap in m:oMath
                        result = `</w:t></w:r><m:oMath>${unescapedXml}</m:oMath><w:r><w:t xml:space="preserve">`;
                        console.log('Wrapping in oMath tags');
                    }
                    
                    console.log('Generated OMML replacement:', result.substring(0, 200) + '...');
                    
                    // Validate the generated XML
                    if (result.includes('<m:oMath><m:oMath>')) {
                        console.error('❌ NESTED m:oMath DETECTED!');
                    }
                    if (!result.includes('<m:oMath>')) {
                        console.error('❌ NO m:oMath TAGS FOUND!');
                    }
                    
                    return result;
                }
            },
            {
                pattern: /§MATH_OMML_BLOCK§((?:(?!§\/MATH_OMML_BLOCK§)[\s\S])*)§\/MATH_OMML_BLOCK§/g,
                replacement: (match, ommlXml) => {
                    console.log('Processing MATH_OMML_BLOCK marker:', match.substring(0, 100) + '...');
                    
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
                        console.log('Double-escaped block content detected, unescaping again...');
                        unescapedXml = decodeHtmlEntities(unescapedXml);
                    }

                    console.log('Unescaped OMML XML (block):', unescapedXml.substring(0, 200) + '...');

                    // Check if the XML is already a complete block structure
                    let result;
                    if (unescapedXml.trim().startsWith('<m:oMathParaPr') || unescapedXml.trim().startsWith('<m:jc')) {
                        // Already contains paragraph properties, wrap in m:oMathPara
                        result = `</w:t></w:r>
                     <m:oMathPara>
                       ${unescapedXml}
                     </m:oMathPara>
                   <w:r><w:t xml:space="preserve">`;
                        console.log('Using complete block structure with existing ParaPr');
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
                        console.log('Adding ParaPr wrapper to complete oMath');
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
                        console.log('Wrapping partial content completely');
                    }
                   
                    console.log('Generated OMML block replacement:', result.substring(0, 200) + '...');
                    
                    // Validate the generated XML
                    if (result.includes('<m:oMath><m:oMath>')) {
                        console.error('❌ NESTED m:oMath DETECTED IN BLOCK!');
                    }
                    if (result.includes('<m:oMathPara><m:oMathPara>')) {
                        console.error('❌ NESTED m:oMathPara DETECTED!');
                    }
                    if (!result.includes('<m:oMathPara>')) {
                        console.error('❌ NO m:oMathPara TAGS FOUND!');
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
                    console.log(`Found pattern match in text node: ${content.substring(0, 100)}...`);
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
                        console.error('❌ MALFORMED w:t tag detected:', result);
                        // Fallback: construct a safe version
                        return `<w:t xml:space="preserve">${newContent}</w:t>`;
                    }
                    
                    return result;
                }
                return match;
            });
            
            if (docXml !== originalDocXml) {
                console.log('Document XML was modified by pattern replacement in text nodes');
            }
        });

        // Apply replacements - second pass: process content that might span multiple paragraphs
        // This handles cases where math markers might be split across text nodes
        replacements.forEach(({pattern, replacement}) => {
            const originalDocXml = docXml;
            
            if (pattern.test(docXml)) {
                console.log(`Found pattern match in full document for pattern: ${pattern}`);
                docXml = docXml.replace(pattern, (match, ...args) => {
                    console.log(`Processing document-level match: ${match.substring(0, 100)}...`);
                    const result = replacement(match, ...args);
                    console.log(`Document-level replacement: ${result.substring(0, 100)}...`);
                    return result;
                });
            }
            
            if (docXml !== originalDocXml) {
                console.log('Document XML was modified by document-level pattern replacement');
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

        // 🔧 CLEANUP: Fix malformed w:t tags that could cause XML parsing errors
        docXml = docXml.replace(/<w:t\/\s+([^>]*?)>(.*?)<\/w:t>/g, '<w:t $1>$2</w:t>');
        docXml = docXml.replace(/<w:t\s*\/>/g, '<w:t></w:t>'); // Convert empty self-closing to regular empty tags

        // 🔍 DEBUG: Sample math content after processing
        const mathSample = docXml.match(/<m:oMath>[\s\S]{0,200}/);
        if (mathSample) {
            console.log('🔍 SAMPLE: Math content after text processing:', mathSample[0] + '...');
        }

        // 🔍 XML VALIDATION - Check for common corruption issues
        console.log('=== XML VALIDATION ===');
        const xmlIssues = [];
        
        // Check for nested math elements
        if (docXml.includes('<m:oMath><m:oMath>')) {
            xmlIssues.push('❌ NESTED <m:oMath> elements detected');
        }
        if (docXml.includes('<m:oMathPara><m:oMathPara>')) {
            xmlIssues.push('❌ NESTED <m:oMathPara> elements detected');
        }
        
        // Check for unclosed tags
        const oMathCount = (docXml.match(/<m:oMath>/g) || []).length;
        const oMathCloseCount = (docXml.match(/<\/m:oMath>/g) || []).length;
        if (oMathCount !== oMathCloseCount) {
            xmlIssues.push(`❌ UNCLOSED m:oMath tags: ${oMathCount} open, ${oMathCloseCount} close`);
        }
        
        const oMathParaCount = (docXml.match(/<m:oMathPara>/g) || []).length;
        const oMathParaCloseCount = (docXml.match(/<\/m:oMathPara>/g) || []).length;
        if (oMathParaCount !== oMathParaCloseCount) {
            xmlIssues.push(`❌ UNCLOSED m:oMathPara tags: ${oMathParaCount} open, ${oMathParaCloseCount} close`);
        }
        
        // Check for invalid characters that could break XML
        if (docXml.includes('&lt;m:')) {
            xmlIssues.push('❌ DOUBLE-ESCAPED math tags detected (&lt;m:)');
        }
        
        // Check for broken text runs
        if (docXml.includes('</w:t></w:r></w:t></w:r>')) {
            xmlIssues.push('❌ MALFORMED text runs detected');
        }
        
        // 🔧 NEW: Check for malformed w:t tags that could cause parsing errors
        if (docXml.includes('<w:t/ ') || docXml.includes('<w:t/>') && docXml.includes('</w:t>')) {
            xmlIssues.push('❌ MALFORMED w:t tags detected (mixed self-closing and regular)');
        }
        
        if (xmlIssues.length > 0) {
            console.error('🚨 XML CORRUPTION DETECTED:');
            xmlIssues.forEach(issue => console.error(issue));
            
            // Try to find the first problematic math element
            const firstBadMath = docXml.match(/<m:oMath><m:oMath>[\s\S]*?<\/m:oMath><\/m:oMath>/);
            if (firstBadMath) {
                console.error('First nested math element:', firstBadMath[0].substring(0, 200) + '...');
            }
        } else {
            console.log('✅ XML validation passed - no issues detected');
        }

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