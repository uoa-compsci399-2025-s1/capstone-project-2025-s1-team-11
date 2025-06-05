# docxDTO


*React + Node.js (ESM)*

Work in progress — basic parsing of sections, questions, answers, marks, images, and inline formatting into `contentFormatted` HTML strings.

---

## Recent Fixes

### Image Sizing Fix (Multiple Instances)
**Problem**: When the same image appears multiple times in a DOCX with different dimensions (e.g., `rId4` appearing with both 75.50x90.75 and 120.75x145.14), the last occurrence would overwrite earlier ones, causing all instances to have the same size.

**Solution**: Updated the processing pipeline to store per-instance dimensions instead of per-embedId dimensions:
- `extractDocumentXml.js`: Now stores `drawingInstances` array with position information (paragraphIndex, runIndex)
- `extractPlainText.js`: Looks up correct dimensions by matching position instead of just embedId
- Data flows through: `docxParser.js` → `transformXmlToDto.js` → `buildContentFormatted.js` → `extractPlainText.js`

**Result**: Each image instance now gets its correct size based on where it appears in the document.

### Image Aspect Ratio Fix (RichTextEditor)
**Problem**: Images were getting stretched/distorted after resizing in the RichTextEditor due to conflicting CSS styles. The width renderHTML was setting `height: auto` which overrode explicit height attributes, causing aspect ratio distortion during export.

**Solution**: Fixed the renderHTML logic in both `RichTextEditor.jsx` and `CustomResizableExtension.js`:
- **Conditional Style Application**: Width renderHTML only sets `height: auto` when no height attribute is present
- **Coordinated Rendering**: When both width and height are present, height renderHTML includes both dimensions in style
- **Proper Transaction Dispatch**: Fixed resize extension to dispatch TipTap transactions on mouseup to persist changes
- **Improved Aspect Ratio Calculation**: Added safety checks for naturalWidth/naturalHeight with fallbacks

**Result**: Images now maintain their aspect ratio during resize and export correctly without distortion.

### DOCX Math Corruption Fix

## Problem

Previously, when importing certain DOCX exams, the math elements would be corrupted when trying to open the exported DOCX file. This happened because:

1. **Nested OMML Structure**: The extraction logic was capturing full `<m:oMathPara>` elements including the inner `<m:oMath>` tags
2. **Export Logic Wrapping**: The export logic would wrap the content in additional `<m:oMath>` tags, creating invalid nested structures like:
   ```xml
   <m:oMath>
     <m:oMathPara>
       <m:oMath>...</m:oMath>  <!-- INVALID: nested m:oMath -->
     </m:oMathPara>
   </m:oMath>
   ```
3. **Duplicate Extraction**: Some documents had both inline and block versions of the same equations being extracted separately

## Solution

### 1. Updated Math Extraction (`extractDocumentXml.js`)

- **Extract Inner Content Only**: Now extracts only the inner content of math elements, not the wrapper tags
- **Prevent Duplication**: Properly filters out `<m:oMath>` elements that are already inside `<m:oMathPara>` to avoid duplicates
- **Maintain Context**: Still correctly identifies block vs inline math context

**Before:**
```javascript
// Would extract: <m:oMathPara><m:oMath>content</m:oMath></m:oMathPara>
originalXml: "<m:oMathPara><m:oMathParaPr><m:jc m:val=\"left\"/></m:oMathParaPr><m:oMath>...</m:oMath></m:oMathPara>"
```

**After:**
```javascript
// Now extracts: content (inner content only)
originalXml: "<m:acc><m:accPr><m:chr m:val=\"̅\"/>...</m:e></m:acc>"
```

### 2. Enhanced Export Logic (`textProcessor.js`)

- **Context-Aware Wrapping**: Different handling for block vs inline math
- **Block Math**: Wrapped in proper `<m:oMathPara>` structure with properties
- **Inline Math**: Wrapped in simple `<m:oMath>` structure

**Block Math Export:**
```xml
<m:oMathPara>
  <m:oMathParaPr>
    <m:jc m:val="left"/>
  </m:oMathParaPr>
  <m:oMath>[inner content]</m:oMath>
</m:oMathPara>
```

**Inline Math Export:**
```xml
<m:oMath>[inner content]</m:oMath>
```

### 3. Updated Placeholder Resolution (`formatExamData.js`)

- **Different Markers**: Uses `§MATH_OMML_BLOCK§` for block math and `§MATH_OMML§` for inline math
- **Preserves Context**: Maintains the distinction between block and inline math throughout the export process

## Result

- ✅ **No More Corruption**: Exported DOCX files with math equations open correctly in Word
- ✅ **Proper Structure**: Valid OMML XML structure without nested `<m:oMath>` elements  
- ✅ **Context Preservation**: Block math displays as block, inline math displays inline
- ✅ **No Duplicates**: Each math element is extracted only once

## Testing

The fix includes debug logging to help track the extraction process:
- Logs when extracting block vs inline math elements
- Shows the first 100 characters of extracted content
- Displays total count and types of extracted math elements

To test with a problematic DOCX file, check the browser console for extraction logs when importing the document.

---

## Notes

- MVP only — complex styles and edge cases not fully supported yet
- Input and output examples are not included; supply your own `.docx` files for testing
- Equation notation is only partially supported currently (WIP)
- Font colour currently ignored
- Fonts (other than monospace) currently ignored
- Not parsing bookmarks currently (potentially switch to this later for question start identification)
- Not currently testing for unsupported or erroneous inputs (will ideally flag to user eventually)
- Currently only parses whole number marks, will quick fix this

---

## .docx formatting

This is a WIP still, currently:

- Question start: "[x mark/s]"
- Question end: next hard return
- Questions belonging to a section will be nested inside that section<br>
  <br>
- Answer block start: immediately after question end
- *3-5 individual answers each end with a single hard return*
- Answer block end: an additional hard-return (ie two in a row), or a section break<br>
  <br>
- Section start: section break
- Section end: section break or EOF
- *NOTE* a shared section break can indicate both the end of current section and start of next section
- *NOTE* if a section ends, and there is no meaningful content between the ending section break 

---

## Integration
Can be called by other parts of the application using `parseDocx.js`:

```javascript
import { parseDocx } from './docxDTO/docxParser.js';

async function importDocument(filePath) {
  try {
    const parsedData = await parseDocx(filePath);
    // Use the parsed data (e.g., send to Redux store)
    return parsedData;
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
}
```
The `parseDocx.js` function handles all the extraction, parsing, and transformation steps and returns a structured JSON object representing the document's content.

---

## Testing Quick Start

```bash
npm install fast-xml-parser jszip
```

- Add `.docx` files to `client/docxDTO/inputFiles/`
- From `/client`, run:

  ```bash
  npm run docxdto
  ```
- You will be prompted to select your file

- Output JSON saved to `client/docxDTO/outputFiles/`

---


## File Structure

- `inputFiles/` — store `.docx` test files here
- `outputFiles/` — generated JSON output files
- `parseDocxDto.js` — main runner script
- `transformXmlToDto.js` — core transformation logic
- `docxParser.js` — API for programmatic usage
- `utils/` — helper functions (formatting, text extraction, XML parsing)