// src/components/mapDisplay.jsx
import React from "react";
import AnswerMappingVisual from "./AnswerMappingVisual";
import AnswerMappingGrid from "./AnswerMappingGrid";

export default function MapDisplay({ question, selectedVersion, exam, displayStyle = "grid" }) {
  const versionIndex = exam?.versions?.indexOf(selectedVersion) ?? 0;
  const mapping = question?.answerShuffleMaps?.[versionIndex];

  if (!mapping) return null;

  const actualAnswerCount = question?.answers?.filter(answer => answer.contentFormatted?.trim() || answer.contentText?.trim()).length || 0;
  const effectiveMapping = mapping.slice(0, actualAnswerCount);

  return (
    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
      {displayStyle === "grid" ? (
        <AnswerMappingGrid mapping={effectiveMapping} />
      ) : (
        <AnswerMappingVisual mapping={effectiveMapping} />
      )}
    </div>
  );
}
