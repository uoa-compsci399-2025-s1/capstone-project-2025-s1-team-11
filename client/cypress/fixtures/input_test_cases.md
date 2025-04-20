# Input Test Cases

This document tracks the test input files used for verifying file import functionality.

---

## DOCX Cases

| Filename                        | Description                            | Expected Result              |
|---------------------------------|----------------------------------------|------------------------------|
| `valid_exam_control.docx`       | A standard, correctly formatted exam   | ✅ Parses as Exam             |
| `duplicate_question.docx`       | A question is repeated                 | ❌ Error: Duplicate question  |
| `duplicate_answer_options.docx` | Two or more identical answers provided | ❌ Error: Duplicate answers   |
| `too_many_qs.docx`                   | >20 questions provided                 | ❌ Error: Too many questions  |
| `too_few_qs.docx`                    | <20 questions provided                 | ❌ Error: Too few questions   |
| `coloured_font.docx`            | >20 questions provided                 | ❌ Error: Style not supported |


## XML Cases

| Filename                 | Description                 | Expected Result            |
|--------------------------|-----------------------------|----------------------------|
| `valid_exam.xml`         | Proper exam structure       | ✅ Parses as Exam           |
| `missing_questions.xml`  | No <questions> block        | ❌ Error: Missing questions |
| `malformed.xml`          | Incomplete or unclosed tags | ❌ XML parse error          |
| `multiple_root_tags.xml` | Invalid XML structure       | ❌ XML parse error          |