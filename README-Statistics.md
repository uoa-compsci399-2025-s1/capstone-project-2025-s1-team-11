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

### Files Modified

1. **UI Components**
   - `/client/src/components/marker/results.jsx`: Main results display and histogram visualization
   - `/client/src/pages/marker.jsx`: State management for exam results
   - `/client/src/components/marker/StudentReport.jsx`: Individual student report display

### Resource Files

The system uses several types of files:

- Exam documents in Word format, containing question text and structure
- Excel files containing correct answers for different exam versions
- Teleform data files containing student responses

## Using the Feature

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

### Data Structure

The exam results follow this structure:
```javascript
{
  exam: {
    title: String,
    questions: [/* question objects */]
  },
  correctAnswers: {
    [versionId]: {/* answer map */}
  },
  studentResponses: [/* student response objects */]
}
```

### Display Considerations

- For performance reasons, the student results list limits display to 100 students
- Answer formats are mapped between numeric codes (01, 02, 04, 08, 16) and letters (A, B, C, D, E)
- The implementation includes defensive programming to handle edge cases

## Future Enhancements

Potential areas for further development:
- Additional statistical measures (standard deviation, median, etc.)
- More sophisticated visualization options
- Data export in additional formats (CSV, Excel)
- Comparative analysis between different exam versions 