// src/components/AnswerMappingVisual.jsx
import React from "react";

const AnswerMappingVisual = ({ mapping, question }) => {
  if (!mapping || !mapping.length) return null;

  // Filter out invalid answers, only map solutions that are present :)
  const validAnswers = (question?.answers || [])
    .filter(answer => answer && answer.contentText && answer.contentText.trim() !== '');

  const validMapping = mapping.slice(0, validAnswers.length);
  const letters = validMapping.map((_, i) => String.fromCharCode(65 + i));

  if (validMapping.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {validMapping.map((targetPos, originalIndex) => {
        const from = letters[originalIndex];
        const to = letters[targetPos];

        return (
          <div
            key={originalIndex}
            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}
          >
            <span>{from}</span>
            <span style={{ fontSize: "1.2rem" }}>→</span>
            <span>{to}</span>
          </div>
        );
      })}
    </div>
  );
};

export default AnswerMappingVisual;