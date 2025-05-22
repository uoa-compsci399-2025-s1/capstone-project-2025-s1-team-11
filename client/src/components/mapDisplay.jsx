// src/components/mapDisplay.jsx
import React from "react";
import AnswerMappingVisual from "./AnswerMappingVisual";
import AnswerMappingGrid from "./AnswerMappingGrid";
import { useSelector } from "react-redux";
import { selectExamData } from "../store/exam/selectors";

export default function MapDisplay({ question, selectedVersion, exam, displayStyle = "grid", examBodyIndex, questionsIndex, showAnswers }) {
  const versionIndex = exam?.versions?.indexOf(selectedVersion) ?? 0;
  const mapping = question?.answerShuffleMaps?.[versionIndex];
  const examData = useSelector(selectExamData);

  if (!mapping) return null;

  // Use the full length of answers array or fall back to teleformOptions length
  const answerCount = question?.answers?.length || examData?.teleformOptions?.length || 5;
  const effectiveMapping = mapping.slice(0, answerCount);

  return (
    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
      {displayStyle === "grid" ? (
        <AnswerMappingGrid 
          mapping={effectiveMapping} 
          question={question}
          examBodyIndex={examBodyIndex}
          questionsIndex={questionsIndex}
          showAnswers={showAnswers}
        />
      ) : (
        <AnswerMappingVisual mapping={effectiveMapping} />
      )}
    </div>
  );
}
