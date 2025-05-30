// src/pages/Marker.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Typography, Button, Divider } from "antd";
import { useSelector } from "react-redux";
import { generateMarkingKey } from "../utilities/marker/keyGenerator.js";
import { markExams } from "../utilities/marker/examMarker.js";
import DataReview from "../components/marker/dataReview.jsx";
import {Results} from "../components/marker/results.jsx"
import {teleformReader} from "../components/marker/teleformReader.jsx";
import {selectCorrectAnswerIndices, selectExamData} from "../store/exam/selectors.js";
import useMessage from "../hooks/useMessage.js";

const Marker = () => {
  const message = useMessage();
  const examData = useSelector(selectExamData);
  const examAnswers = useSelector(selectCorrectAnswerIndices);
  const [teleformData, setTeleformData] = useState("");
  const [markingKey, setMarkingKey] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  // Add state for exam data that can be updated by the Results component
  const [localExamData, setLocalExamData] = useState(null);

  // Use examData from redux, or localExamData if it exists
  const currentExamData = localExamData || examData;

  useEffect(() => {
    if (examAnswers) {
      setMarkingKey(generateMarkingKey(examAnswers));
    }
  }, [examAnswers]);

  useEffect(() => {
    // When redux exam data changes, update our local copy
    setLocalExamData(examData);
  }, [examData]);

  const handleMarkExams = useCallback(() => {
    if (!teleformData) {
      message.error("Please enter teleform scan data before marking.");
      return false;
    }
    if (!markingKey) {
      message.error("Marking key is not available.");
      return false;
    }
    
    try {
      //console.log("Marking exams with data:", teleformData);
      
      const examResults = markExams(currentExamData, teleformData, markingKey);
      //console.log("Exam results:", examResults);
      
      if (examResults && examResults.all && Array.isArray(examResults.all) && examResults.all.length > 0) {
        setResultsData(examResults);
        message.success(`Successfully marked ${examResults.all.length} exams.`);
        return true;
      } else {
        message.error("Failed to mark exams: No valid student data found");
        return false;
      }
    } catch (error) {
      console.error("Error marking exams:", error);
      message.error("Failed to mark exams: " + error.message);
      return false;
    }
  }, [teleformData, markingKey, currentExamData, message]);

  const handleTeleformDataChange = (e) => {
    setTeleformData(e.target.value);
  };

  const renderContent = () => {
    //console.log("Current step:", currentStep);
    //console.log("Results data:", resultsData);
    
    switch (currentStep) {
      case 0:
        return <DataReview examData={currentExamData} markingKey={markingKey} />;
      case 1:
        return teleformReader({teleformData, markingKey, handleTeleformDataChange});
      case 2:
        // Make sure we're passing valid data to the Results component
        if (!resultsData || !resultsData.all || !Array.isArray(resultsData.all)) {
          return (
            <Results
              resultsData={[]}
              examData={currentExamData}
              teleformData={teleformData}
              markingKey={markingKey}
              setResultsData={(data) => setResultsData({ all: data })}
              setExamData={setLocalExamData}
            />
          );
        }
        
        //console.log("Passing to Results component:", resultsData.all);
        return (
          <Results
            resultsData={resultsData.all}
            examData={currentExamData}
            teleformData={teleformData}
            markingKey={markingKey}
            setResultsData={(data) => setResultsData({ all: data })}
            setExamData={setLocalExamData}
          />
        );
      default:
        return null;
    }
  };

  const next = () => {
    const nextStep = Math.min(currentStep + 1, 2);
    // Only try to mark exams when moving to step 2
    if (nextStep === 2) {
      if (handleMarkExams()) {
        setCurrentStep(nextStep);
      }
    } else {
      setCurrentStep(nextStep);
    }
  };

  const prev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
      <>
      <Typography.Title level={1}>MCQ Auto-Marker</Typography.Title>
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