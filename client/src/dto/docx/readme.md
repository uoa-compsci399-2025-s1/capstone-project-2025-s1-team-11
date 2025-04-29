# docxDTO


*React + Node.js (ESM)*

Work in progress — basic parsing of sections, questions, answers, marks, images, and inline formatting into `contentFormatted` HTML strings.

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