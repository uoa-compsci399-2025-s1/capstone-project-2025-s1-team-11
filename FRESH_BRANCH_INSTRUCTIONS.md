# Essential Changes for Fresh Branch - DOCX Math Export Fix

## Root Cause
Malformed XML attribute handling causing `Failed to parse QName 'w:txml:space'` error.

## Required Changes

### File: `client/src/services/docxExport/modules/processors/textProcessor.js`

You need TWO essential pieces:

#### 1. OMML Marker Processing Replacements Array

Add this replacements array with the OMML marker processing logic:

```javascript
const replacements = [
    // ... other formatting patterns (BOLD, ITALIC, etc.) ...
    
    // ESSENTIAL: Process OMML inline math markers
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
    
    // ESSENTIAL: Process OMML block math markers
    {
        pattern: /§MATH_OMML_BLOCK§((?:(?!§\/MATH_OMML_BLOCK§)[\s\S])*)§\/MATH_OMML_BLOCK§/g,
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
            let unescapedXml = decodeHtmlEntities(unescapedXml);
            
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
```

#### 2. Fixed XML Attribute Handling

In the pattern replacement logic, replace the attribute handling with:

```javascript
// Apply replacements - first pass: process individual text nodes
replacements.forEach(({pattern, replacement}) => {
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
});

// Apply replacements - second pass: process content that might span multiple paragraphs
replacements.forEach(({pattern, replacement}) => {
    if (pattern.test(docXml)) {
        docXml = docXml.replace(pattern, (match, ...args) => {
            return replacement(match, ...args);
        });
    }
});
```

#### 3. Essential Math Namespace Declaration

Add this after processing:

```javascript
// Ensure that OMML namespace is declared in the document
if (docXml.includes('<m:oMath>') && !docXml.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"')) {
    docXml = docXml.replace('<w:document ', '<w:document xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ');
}

// CLEANUP: Fix malformed w:t tags that could cause XML parsing errors
docXml = docXml.replace(/<w:t\/\s+([^>]*?)>(.*?)<\/w:t>/g, '<w:t $1>$2</w:t>');
docXml = docXml.replace(/<w:t\s*\/>/g, '<w:t></w:t>');
```

## What This Fixes

1. **Root Issue**: Prevents `<w:txml:space="preserve">` malformed XML
2. **Math Processing**: Converts `§MATH_OMML§` markers to actual OMML XML
3. **Entity Decoding**: Properly unescapes `&lt;`, `&gt;`, `&quot;` back to `<`, `>`, `"`
4. **XML Validation**: Ensures proper math namespace and structure

## What You DON'T Need

- Math extraction changes (already working)
- Block vs inline detection fixes (not actual bugs)
- Registry modifications (already working)
- Debugging logs (removed)
- XML validation additions (helpful but not essential) 