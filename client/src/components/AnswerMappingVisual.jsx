// src/components/AnswerMappingVisual.jsx
import React from "react";

const AnswerMappingVisual = ({ mapping }) => {
  if (!mapping || !mapping.length) return null;

  const letters = Array.from({ length: mapping.length }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {mapping.map((targetPos, originalIndex) => {
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
