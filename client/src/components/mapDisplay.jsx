// src/components/mapDisplay.jsx
import React from "react";
import AnswerMappingVisual from "./AnswerMappingVisual";

export default function MapDisplay({ question, selectedVersion, exam }) {
  const versionIndex = exam?.versions?.indexOf(selectedVersion) ?? 0;
  const mapping = question?.answerShuffleMaps?.[versionIndex];

  if (!mapping) return null;

  return (
    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
      <AnswerMappingVisual mapping={mapping} />
    </div>
  );
}
