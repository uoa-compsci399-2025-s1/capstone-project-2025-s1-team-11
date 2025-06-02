# MoodleXML Import Tests

### XML Parsing (`moodleXmlDTO.test.js`)
- Basic XML structure parsing
- Image handling with `@@PLUGINFILE@@` replacement
- Different question types (multichoice, truefalse, description, category)
- Decimal marks extraction from `<defaultgrade>`
- Text formatting preservation (subscript, superscript, HTML)
- Error handling for invalid XML

### Conversion Logic (`convertMoodleXmlToJsonWithSections.test.js`)
- Section sorting (descriptions first, then questions)
- Question type filtering (only supported types imported)
- Marks extraction (defaultgrade vs text-based marks)
- Correct answer detection (fraction >= 50% = correct)
- Section creation from description questions
- Complete integration test with all features
