# LaTeX DTO Implementation

## Overview

This implementation provides support for importing LaTeX exam files (with the `.tex` extension) into the application. The LaTeX parser specifically targets files created using the [exam document class](https://math.mit.edu/~psh/exam/examdoc.pdf).

## Features

- Extract metadata from the LaTeX document (course code, semester, title, etc.)
- Parse questions and answers, including:
  - Multiple-choice questions (using `choices` or `oneparchoices` environments)
  - Questions organized into sections (using `parts` environments)
  - Support for marks annotation
  - Correct answer identification (using `\mycorrectchoice` command)
- Convert LaTeX content to HTML-formatted text for display

## Implementation Details

The LaTeX parsing is implemented through several components:

1. `latexParser.js` - Main entry point for parsing LaTeX files
2. `parseLatexToStructure.js` - Converts raw LaTeX content into structured data
3. `latexToHtml.js` - Converts LaTeX text to HTML formatted text
4. `transformLatexToDto.js` - Transforms the structured data into the application's DTO format

## Usage

```javascript
import { parseLatex } from './dto/latex/latexParser.js';

async function importLatexExam(file) {
  try {
    const parsedData = await parseLatex(file);
    // Use the parsed data (e.g., send to Redux store)
    return parsedData;
  } catch (error) {
    console.error('Error parsing LaTeX exam:', error);
    throw error;
  }
}
```

## Limitations

- Support is limited to the exam document class format
- LaTeX math expressions are preserved, but not converted to full MathML representation
- Complex customizations in the LaTeX file may not be correctly parsed
- LaTeX algorithms, tabular environments, and complex figures are not fully supported

## Example Files

The `examples` directory contains:
- `exam_2025SS.tex` - An example LaTeX exam file
- `output.json` - The expected JSON output after parsing the example file 