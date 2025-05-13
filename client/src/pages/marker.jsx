// src/pages/Marker.jsx

import React, { useState, useEffect } from "react";
import { Typography, message, Button, Input, Divider } from "antd";
import { useSelector } from "react-redux";
import { generateMarkingKey } from "../utilities/marker/keyGenerator.js";
import { markExams } from "../utilities/marker/examMarker.js";
import { generateResultOutput } from "../utilities/marker/outputFormatter.js";
import {upload} from "../components/marker/upload.jsx";
import {marking} from "../components/marker/marking.jsx";
import {results} from "../components/marker/results.jsx"
import {teleformReader} from "../components/marker/teleformReader.jsx";

const Marker = () => {
  const examData = useSelector((state) => state.exam.examData);
  const [teleformData, setTeleformData] = useState("");
  const [markingKeyType, setMarkingKeyType] = useState("enhanced");
  const [markingKey, setMarkingKey] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [exportFormat, setExportFormat] = useState("json");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (examData) {
      setMarkingKey(generateMarkingKey(examData))
      /*
      markingKey.forEach(key => {
        console.log(key)
        console.log(markingKey[key])
        console.log("----")
      })

       */
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
    if (!markingKey) {
      message.error("Marking key is not available.");
      return;
    }
    
    try {
      console.log("Marking exams with data:", teleformData);

      
      const examResults = markExams(teleformData, markingKey);
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
    if (!markingKey) {
      message.error("No marking key available to export.");
      return;
    }
    
    let content, filename, type;
    
    if (markingKeyType === "legacy") {
      content = markingKey.legacyKey;
      filename = `${examData.courseCode || 'exam'}_marking_key.txt`;
      type = "text/plain";
    } else {
      content = JSON.stringify(markingKey.enhancedKey, null, 2);
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
        return upload({ examData, setMarkingKeyType, markingKeyType, handleExportMarkingKey, markingKey} );
      case 1:
        return teleformReader({teleformData,handleTeleformDataChange,handleMarkExams});
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