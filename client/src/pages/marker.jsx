// src/pages/Marker.jsx

import React, { useState, useEffect } from "react";
import { Typography, message, Button, Radio, Input, Divider } from "antd";
import { useSelector } from "react-redux";
import { generateMarkingKeys, markExams, generateResultOutput } from "../utilities/createMarkingKey";
import MarkerProgressWrapper from "../components/MarkerProgressWrapper";

const { TextArea } = Input;

const Marker = () => {
  const examData = useSelector((state) => state.exam.examData);
  const [teleformData, setTeleformData] = useState("");
  const [markingKeyType, setMarkingKeyType] = useState("enhanced");
  const [markingKeys, setMarkingKeys] = useState(null);
  const [results, setResults] = useState([]);
  const [exportFormat, setExportFormat] = useState("json");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (examData) {
      const keys = generateMarkingKeys(examData);
      setMarkingKeys(keys);
    }
  }, [examData]);

  const handleTeleformDataChange = (e) => {
    setTeleformData(e.target.value);
  };

  const handleMarkExams = () => {
    if (!teleformData) {
      message.error("Please enter teleform scan data before marking.");
      return;
    }
    if (!markingKeys) {
      message.error("Marking key is not available.");
      return;
    }
    
    const isLegacy = markingKeyType === "legacy";
    const keyToUse = isLegacy ? markingKeys.legacyKey : markingKeys.enhancedKey;
    
    if (!keyToUse) {
      message.error("Selected marking key is not available.");
      return;
    }
    
    try {
      console.log("Marking exams with data:", teleformData);
      console.log("Using key:", keyToUse);
      console.log("Is legacy:", isLegacy);
      
      const examResults = markExams(teleformData, keyToUse, isLegacy);
      console.log("Exam results:", examResults);
      
      setResults(examResults);
      message.success("Exams marked successfully.");
      
      // Automatically advance to the results step
      setCurrentStep(2);
    } catch (error) {
      console.error("Error marking exams:", error);
      message.error("Failed to mark exams: " + error.message);
    }
  };

  const handleExportMarkingKey = () => {
    if (!markingKeys) {
      message.error("No marking key available to export.");
      return;
    }
    
    let content, filename, type;
    
    if (markingKeyType === "legacy") {
      content = markingKeys.legacyKey;
      filename = `${examData.courseCode || 'exam'}_marking_key.txt`;
      type = "text/plain";
    } else {
      content = JSON.stringify(markingKeys.enhancedKey, null, 2);
      filename = `${examData.courseCode || 'exam'}_marking_key.json`;
      type = "application/json";
    }
    
    try {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); 
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success("Marking key exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Failed to export marking key.");
    }
  };

  const handleExportResults = () => {
    if (!results || results.length === 0) {
      message.error("No results available to export.");
      return;
    }
    
    let content, filename, type;
    
    if (exportFormat === "json") {
      content = JSON.stringify(results, null, 2);
      filename = `${examData.courseCode || 'exam'}_results.json`;
      type = "application/json";
    } else {
      // Text format (similar to legacy output)
      content = results.map(res => generateResultOutput(res, examData)).join('\n\n');
      filename = `${examData.courseCode || 'exam'}_results.txt`;
      type = "text/plain";
    }
    
    try {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success("Results exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Failed to export results.");
    }
  };

  const renderUploadStep = () => {
    return (
      <>
        <Typography.Title level={3}>Upload Exam Sheet</Typography.Title>
        {examData ? (
          <p>Exam uploaded: {examData.examTitle || 'Unnamed Exam'}</p>
        ) : (
          <p>
            Please upload an exam in the Exam Builder page to begin.
          </p>
        )}
      </>
    );
  };

  const renderMarkingStep = () => {
    return (
      <>
        <Typography.Title level={3}>Exam Marking Utility</Typography.Title>
        <Radio.Group
          onChange={(e) => setMarkingKeyType(e.target.value)}
          value={markingKeyType}
          style={{ marginBottom: 16 }}
        >
          <Radio value="enhanced">Enhanced JSON Key</Radio>
          <Radio value="legacy">Legacy Format Key</Radio>
        </Radio.Group>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleExportMarkingKey} disabled={!markingKeys}>
            Export Marking Key
          </Button>
        </div>
        <TextArea
          rows={6}
          placeholder="Enter teleform scan data here"
          value={teleformData}
          onChange={handleTeleformDataChange}
          style={{ marginBottom: 16 }}
        />
        <div>
          <Button type="primary" onClick={handleMarkExams}>
            Mark Exams
          </Button>
        </div>
      </>
    );
  };

  const renderResultsStep = () => {
    return (
      <>
        <Typography.Title level={3}>Results & Analytics</Typography.Title>
        <p>
          This is the results dashboard. It summarises overall performance statistics and provides detailed insights regarding student responses,
          question-level performance and analysis. You can also export your results for further review.
        </p>
        
        {/* Export format selection */}
        <Radio.Group
          onChange={(e) => setExportFormat(e.target.value)}
          value={exportFormat}
          style={{ marginBottom: 16 }}
        >
          <Radio value="json">JSON Format</Radio>
          <Radio value="text">Text Format (Legacy Style)</Radio>
        </Radio.Group>
        
        {/* Results display */}
        {results && results.length > 0 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleExportResults}>
                Export Results
              </Button>
            </div>
            
            <div className="results-preview" style={{ backgroundColor: "#f5f5f5", padding: 16, maxHeight: 400, overflow: "auto" }}>
              <h4>Preview: {results.length} students</h4>
              {results.map((result, index) => (
                <div key={index} className="student-result" style={{ marginBottom: 12, padding: 8, border: "1px solid #ddd", borderRadius: 4 }}>
                  <h5>{result.lastName || "Unknown"}, {result.firstName || "Unknown"} ({result.studentId || "N/A"})</h5>
                  <p>Version: {result.versionNumber || "N/A"}</p>
                  <p>Score: {result.totalMarks !== undefined ? result.totalMarks : "?"}/{result.maxMarks !== undefined ? result.maxMarks : "?"}</p>
                  <details>
                    <summary>View Details</summary>
                    <pre>{generateResultOutput(result, examData)}</pre>
                  </details>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: 16, backgroundColor: "#f5f5f5", textAlign: "center" }}>
            <p>No results available. Mark exams to see results here.</p>
          </div>
        )}
      </>
    );
  };

  // Render content based on current step
  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderMarkingStep();
      case 2:
        return renderResultsStep();
      default:
        return null;
    }
  };

  const next = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 2));
  };

  const prev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <>
      <Typography.Title>MCQ Auto-Marker</Typography.Title>
      
      <Divider />
      
      <div style={{ margin: "24px 0" }}>
        {renderContent()}
      </div>
      
      <Divider />
      
      <div>
        <Button onClick={prev} disabled={currentStep === 0} style={{ marginRight: 8 }}>
          Back
        </Button>
        <Button type="primary" onClick={next} disabled={currentStep === 2}>
          Next
        </Button>
      </div>
    </>
  );
};

export default Marker;