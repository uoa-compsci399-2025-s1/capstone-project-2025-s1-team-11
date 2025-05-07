// src/components/mapDisplay.jsx
import React from "react";
import AnswerMappingVisual from "./AnswerMappingVisual";
import AnswerMappingGrid from "./AnswerMappingGrid";

export default function MapDisplay({ question, selectedVersion, exam, displayStyle = "grid" }) {
  const versionIndex = exam?.versions?.indexOf(selectedVersion) ?? 0;
  const mapping = question?.answerShuffleMaps?.[versionIndex];

  if (!mapping) return null;

  return (
    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
      {displayStyle === "grid" ? (
        <AnswerMappingGrid mapping={mapping} />
      ) : (
        <AnswerMappingVisual mapping={mapping} />
      )}
    </div>
  );
}
