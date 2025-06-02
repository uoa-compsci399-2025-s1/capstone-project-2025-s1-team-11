# MoodleXML Import Tests

This directory contains tests for the MoodleXML import functionality.

## Test Structure

### Unit Tests
- `moodleXmlDTO.test.js` - Tests for XML parsing and DTO creation
- `../utilities/__tests__/convertMoodleXmlToJsonWithSections.test.js` - Tests for conversion logic

### Test Data
- `testData/` - Directory for test XML files
- Place your comprehensive test XML file here as `comprehensive-test.xml`

## What We Test

### XML Parsing (`moodleXmlDTO.test.js`)
- ✅ Basic XML structure parsing
- ✅ Image handling with `@@PLUGINFILE@@` replacement
- ✅ Different question types (multichoice, truefalse, description, category)
- ✅ Decimal marks extraction from `<defaultgrade>`
- ✅ Text formatting preservation (subscript, superscript, HTML)
- ✅ Error handling for invalid XML

### Conversion Logic (`convertMoodleXmlToJsonWithSections.test.js`)
- ✅ Section sorting (descriptions first, then questions)
- ✅ Question type filtering (only supported types imported)
- ✅ Marks extraction (defaultgrade vs text-based marks)
- ✅ Correct answer detection (fraction >= 50% = correct)
- ✅ Section creation from description questions
- ✅ Complete integration test with all features

## Running Tests

```bash
# Run all moodleXML tests
npm test moodleXml

# Run specific test file
npm test moodleXmlDTO
npm test convertMoodleXml

# Run with coverage
npm test -- --coverage --testPathPattern="moodleXml"
```

## Adding Your Test XML

1. Create `testData/comprehensive-test.xml` with your real-world test file
2. Add integration tests that use this file to verify end-to-end functionality
3. Use it for manual testing and as documentation of supported features

## Features Covered

- [x] Image handling (`@@PLUGINFILE@@` → base64 data URIs)
- [x] Image size limiting (400px max width)
- [x] Section sorting (descriptions first)
- [x] Question type filtering 
- [x] Marks extraction (XML defaultgrade + text fallback)
- [x] Correct answer detection (fraction-based)
- [x] Text formatting (subscript, superscript)
- [x] Multiple question types support
- [x] Error handling and graceful degradation 