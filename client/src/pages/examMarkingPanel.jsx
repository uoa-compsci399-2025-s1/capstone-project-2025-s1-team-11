// Example of integrating the marking utility in a React component

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  generateMarkingKeys, 
  markExams, 
  generateResultOutput 
} from '../utilities/createMarkingKey';

const ExamMarkingPanel = () => {
  const examData = useSelector(state => state.exam.examData);
  const [teleformData, setTeleformData] = useState('');
  const [results, setResults] = useState([]);
  const [markingKeyType, setMarkingKeyType] = useState('enhanced');
  const [markingKeys, setMarkingKeys] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');

  // Generate marking keys when exam data changes
  React.useEffect(() => {
    if (examData) {
      const keys = generateMarkingKeys(examData);
      setMarkingKeys(keys);
    }
  }, [examData]);

  // Handle teleform data input
  const handleTeleformDataChange = (e) => {
    setTeleformData(e.target.value);
  };

  // Process and mark exams
  const handleMarkExams = () => {
    if (!teleformData || !markingKeys) return;
    
    const keyToUse = markingKeyType === 'legacy' ? markingKeys.legacyKey : markingKeys.enhancedKey;
    const isLegacy = markingKeyType === 'legacy';
    
    try {
      const examResults = markExams(teleformData, keyToUse, isLegacy);
      setResults(examResults);
    } catch (error) {
      console.error('Error marking exams:', error);
      alert('Error marking exams: ' + error.message);
    }
  };

  // Export marking key
  const handleExportMarkingKey = () => {
    if (!markingKeys) return;
    
    let content, filename, type;
    
    if (markingKeyType === 'legacy') {
      content = markingKeys.legacyKey;
      filename = `${examData.courseCode || 'exam'}_marking_key.txt`;
      type = 'text/plain';
    } else {
      content = JSON.stringify(markingKeys.enhancedKey, null, 2);
      filename = `${examData.courseCode || 'exam'}_marking_key.json`;
      type = 'application/json';
    }
    
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export results
  const handleExportResults = () => {
    if (!results || results.length === 0) return;
    
    let content, filename, type;
    
    if (exportFormat === 'json') {
      content = JSON.stringify(results, null, 2);
      filename = `${examData.courseCode || 'exam'}_results.json`;
      type = 'application/json';
    } else {
      // Text format (similar to legacy output)
      content = results.map(res => generateResultOutput(res, examData)).join('\n\n');
      filename = `${examData.courseCode || 'exam'}_results.txt`;
      type = 'text/plain';
    }
    
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!examData) {
    return <div>Please load an exam first</div>;
  }

  return (
    <div className="exam-marking-panel">
      <h2>Exam Marking Utility</h2>
      
      {/* Marking Key Options */}
      <div className="marking-key-options">
        <h3>Marking Key</h3>
        <div>
          <label>
            <input 
              type="radio" 
              name="keyType" 
              value="enhanced" 
              checked={markingKeyType === 'enhanced'}
              onChange={() => setMarkingKeyType('enhanced')} 
            />
            Enhanced JSON Key
          </label>
          <label>
            <input 
              type="radio" 
              name="keyType" 
              value="legacy" 
              checked={markingKeyType === 'legacy'}
              onChange={() => setMarkingKeyType('legacy')} 
            />
            Legacy Format Key
          </label>
        </div>
        <button onClick={handleExportMarkingKey}>
          Export Marking Key
        </button>
      </div>
      
      {/* Teleform Data Input */}
      <div className="teleform-data">
        <h3>Teleform Scan Data</h3>
        <textarea 
          rows="10" 
          placeholder="Paste teleform scan data here..."
          value={teleformData}
          onChange={handleTeleformDataChange}
        />
        <button onClick={handleMarkExams}>
          Mark Exams
        </button>
      </div>
      
      {/* Results */}
      {results.length > 0 && (
        <div className="results-section">
          <h3>Results ({results.length} students)</h3>
          <div>
            <label>
              <input 
                type="radio" 
                name="exportFormat" 
                value="json" 
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')} 
              />
              JSON Format
            </label>
            <label>
              <input 
                type="radio" 
                name="exportFormat" 
                value="text" 
                checked={exportFormat === 'text'}
                onChange={() => setExportFormat('text')} 
              />
              Text Format (Legacy Style)
            </label>
            <button onClick={handleExportResults}>
              Export Results
            </button>
          </div>
          
          <div className="results-preview">
            <h4>Preview:</h4>
            {results.map((result, index) => (
              <div key={index} className="student-result">
                <h5>{result.lastName}, {result.firstName} ({result.studentId})</h5>
                <p>Version: {result.versionNumber}</p>
                <p>Score: {result.totalMarks}/{result.maxMarks}</p>
                <details>
                  <summary>View Details</summary>
                  <pre>{generateResultOutput(result, examData)}</pre>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamMarkingPanel;