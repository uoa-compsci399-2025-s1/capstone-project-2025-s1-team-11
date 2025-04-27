# docxDTO


*React + Node.js (ESM)*

Work in progress — basic parsing of sections, questions, answers, marks, images, and inline formatting into `contentFormatted` HTML strings.

---

## Notes

- MVP only — complex styles and edge cases not fully supported yet
- Input and output examples are not included; supply your own `.docx` files for testing.

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
- `transformXmlToSimpleDto.js` — core transformation logic
- `utils/` — helper functions (formatting, text extraction, XML parsing)