# 📄 DOCX Parser & DTO Builder

This module provides functionality to import `.docx` exam files, extract structured content from them, and transform that into a **JSON-based Data Transfer Object (DTO)**. This is used internally to populate the application's exam state.

---

## What This Includes

| File                                | Purpose                                                         |
|-------------------------------------|-----------------------------------------------------------------|
| `src/parsers/docxParser.js`         | Converts `.docx` files to HTML and parses into a DOM tree       |
| `src/dto/docxDTO.js`                | Walks the DOM tree and builds a structured JSON DTO             |
| `scripts/logDocxDTO.js`             | CLI script to preview the output DTO from a sample .docx file   |
| `src/dto/__tests__/docxDTO.test.js` | Jest test to verify structure and parsing results               |

---

## Prerequisites

Install required packages:

```bash
npm install mammoth jsdom
```

---

## Run the CLI Parser

To preview the generated DTO from a `.docx` file:

```bash
npm run dump:docx
```

This will output something like:

```json
{
  "title": "Imported DOCX Exam",
  "date": "2025-04-25",
  "questions": [
    {
      "id": "q1",
      "content": "<p>[1 mark] What is 2+2?</p>",
      "options": ["4", "3", "5", "6"],
      "answer": null
    }
  ]
}
```

By default, this pulls from `cypress/fixtures/docx/valid_exam_control.docx`.

---

## How It Works

1. **`.docx` to HTML**  
   `mammoth` extracts clean HTML from `.docx` with inline formatting.

2. **HTML to DOM**  
   `jsdom` simulates a browser environment so the code can query `<p>`, `<table>`, and inline elements.

3. **DOM to DTO**  
   - Every question starts with a paragraph like `[1 mark] ...` or `Q1. ...`
   - Following paragraphs are options or supporting content
   - The DTO preserves full HTML inside each `content` field

4. **DTO to JSON**  
   - Easily serializable and Redux-friendly
   - Can be stored or passed to rendering/export logic

---

## Notes

- Images and tables are preserved inline in `content` as HTML tags.
- This currently supports **multiple choice questions**.
- The first answer is assumed correct unless answer detection logic is added later.
- Output structure should match what Redux expects.

---

## Testing

To run all tests:

```bash
npm run test
```

To test only the DTO system:

```bash
npx jest src/dto/__tests__/docxDTO.test.js
```
