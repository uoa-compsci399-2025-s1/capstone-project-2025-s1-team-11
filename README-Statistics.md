# Statistics-Histogram Feature

## Overview

The Statistics-Histogram feature enhances the exam marking system by providing comprehensive analytics and visualizations for exam results. This feature allows teachers and administrators to:

1. View overall class performance statistics
2. Analyze question-by-question response patterns
3. Generate individual student reports with class comparisons
4. Visualize data through histograms, pie charts, and bar graphs

## Key Components

### Results Dashboard

The results dashboard (`results.jsx`) offers multiple views:

- **Performance Summary**: Overview of class statistics including average score, pass rate, and score distribution histogram
- **Question Analysis**: Detailed statistics for each question including difficulty level and answer distribution
- **Student Reports**: Individual student performance with class comparison charts
- **Student Results**: List view of all student scores with detailed breakdowns

### Data Visualization

The feature implements several visualization components:

- Score distribution histograms
- Question difficulty analysis charts
- Per-student pie charts showing correct/incorrect answers
- Student-to-class comparison bar charts

## Implementation Details

### Files Created

1. **Test Data Utilities**
   - `/client/src/utilities/testing/sampleTestData.js`: Pre-generated dataset with 385 simulated student responses
   - `/client/src/utilities/testing/examTestDataGenerator.js`: Utility to process real exam files for test data
   - `/client/src/utilities/testing/generateTestData.js`: Script to run the generator and save output

### Files Modified

1. **UI Components**
   - `/client/src/components/marker/results.jsx`: Added test data loading and histogram displays
   - `/client/src/pages/marker.jsx`: Added state management for test data
   - `/client/src/components/marker/StudentReport.jsx`: Enhanced with defensive programming

### Resource Files

The data generation utilities reference several files in the resources folder:

- **`CS111.docx`**: Example exam document in Word format, containing question text and structure
- **`Versions.xlsx`**: Excel file containing correct answers for different exam versions
- **`2010S2_111.txt`**: Sample teleform data containing student responses
- **`examTestData.json`**: Output file for the generated test data
- **`COMPSCI 111_0000000X.doc`**: Various exam versions for reference

## Test Data Implementation

To test this feature without requiring actual exam files each time, we've implemented:

1. A direct JavaScript data structure (`sampleTestData.js`) for immediate use in the application
2. A data generation utility that can process real exam files when needed

The test data provides:
- A complete exam structure with 20 questions
- Correct answers for each question
- 385 simulated student responses with realistic answer patterns (70% correct rate)
- Pre-calculated statistics for analysis

## Using the Feature

### Loading Test Data

1. Open the MCQ Auto-Marker
2. Navigate to the Results tab
3. Click the "Load Test Data" button to populate with realistic exam data
4. Explore the various statistics and visualization tabs

### Viewing Statistics

- **Performance Summary**: Shows overall class performance with distribution
- **Question Analysis**: View detailed per-question statistics
- **Student Reports**: Select a student to see their detailed report
- **Student Results**: See a list view of all student results

### Exporting Results

The system supports exporting results in two formats:
- JSON format (for further processing)
- Text format (legacy style for compatibility)

## Technical Details

### Test Data Structure

The test data follows this structure:
```javascript
{
  exam: {
    title: "CS111 Exam",
    questions: [/* question objects */]
  },
  correctAnswers: {
    "11000000004": {/* answer map */}
  },
  studentResponses: [/* 385 student response objects */]
}
```

### Display Considerations

- For performance reasons, the student results list limits display to 100 students
- Answer formats are mapped between numeric codes (01, 02, 04, 08, 16) and letters (A, B, C, D, E)
- The implementation includes defensive programming to handle edge cases

### Extending the Test Data

To modify the test data characteristics:
- Adjust the `sampleTestData.js` file to change correct answer rates or response patterns
- Use the generator utilities with different input files for more varied data

## Future Enhancements

Potential areas for further development:
- Additional statistical measures (standard deviation, median, etc.)
- More sophisticated visualization options
- Data export in additional formats (CSV, Excel)
- Comparative analysis between different exam versions 