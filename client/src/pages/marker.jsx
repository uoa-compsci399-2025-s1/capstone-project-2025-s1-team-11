// src/pages/Marker.jsx

import React, { useState, useEffect } from "react";
import { Typography, message, Button, Input, Divider } from "antd";
import { useSelector } from "react-redux";
import { generateMarkingKeys, markExams, generateResultOutput } from "../utilities/createMarkingKey";
import {upload} from "../components/marker/upload.jsx";
import {marking} from "../components/marker/marking.jsx";
import {results} from "../components/marker/results.jsx"

const Marker = () => {
  const examData = useSelector((state) => state.exam.examData);
  const [teleformData, setTeleformData] = useState("");
  const [markingKeyType, setMarkingKeyType] = useState("enhanced");
  const [markingKeys, setMarkingKeys] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [exportFormat, setExportFormat] = useState("json");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (examData) {
      console.log(examData)
      console.log(examData.examBody)
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
      
      setResultsData(examResults);
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


  // Render content based on the current step
  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return upload({ examData, setMarkingKeyType, markingKeyType, handleExportMarkingKey, markingKeys} );
      case 1:
        return marking({teleformData,handleTeleformDataChange,handleMarkExams});
      case 2:
        return results({setExportFormat,exportFormat,resultsData,handleExportResults,examData});
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