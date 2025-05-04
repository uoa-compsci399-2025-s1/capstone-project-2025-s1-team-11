// src/components/AnswerMappingGrid.jsx
import React from "react";

const AnswerMappingGrid = ({ mapping }) => {
  if (!mapping || !mapping.length) return null;

  const letters = Array.from({ length: mapping.length }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div className="mapping-grid-container" style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `68px repeat(${mapping.length}, 36px)`,
            gap: "2px",
            fontSize: "0.8rem",
          }}
        >
          {/* Header row */}
          <div
            style={{
              gridColumn: "1 / 2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              padding: "4px",
              backgroundColor: "#fafafa",
              borderRadius: "4px",
            }}
          >
            Original →
          </div>

          {/* Column headers */}
          {letters.map((letter, index) => (
            <div
              key={`header-${index}`}
              style={{
                gridColumn: `${index + 2} / ${index + 3}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                backgroundColor: "#f6ffed",
                borderRadius: "4px",
                padding: "4px",
                border: "1px solid #b7eb8f",
              }}
            >
              {letter}
            </div>
          ))}

          {/* Rows */}
          {mapping.map((targetPos, originalIndex) => (
            <React.Fragment key={`row-${originalIndex}`}>
              <div
                style={{
                    gridColumn: "1 / 2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    backgroundColor: "#e6f7ff",
                    borderRadius: "4px",
                    padding: "4px",
                    border: "1px solid #91d5ff",
                }}
              >
                {letters[originalIndex]}
              </div>

              {letters.map((_, colIndex) => (
                <div
                    key={`cell-${originalIndex}-${colIndex}`}
                    style={{
                        gridColumn: `${colIndex + 2} / ${colIndex + 3}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: targetPos === colIndex ? "#1890ff" : "#ffffff",
                        color: targetPos === colIndex ? "#ffffff" : "#d9d9d9",
                        border: targetPos === colIndex
                        ? "1px solid #096dd9"
                        : "1px solid #d9d9d9",
                        borderRadius: "4px",
                        width: "36px",
                        height: "30px",
                        position: "relative",
                    }}
                >
                  {targetPos === colIndex && (
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%",
                      }}
                    >
                      {letters[originalIndex]}→{letters[colIndex]}
                    </div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        {/* Example */}
        {mapping.length > 0 && (
            <div style={{ marginTop: "6px", fontStyle: "italic", fontSize: "0.85rem" }}>
                <p style={{ margin: "0 0 4px 0" }}>
                Example: Original answer <strong>{letters[0]}</strong> is now in position{" "}
                <strong>{letters[mapping[0]]}</strong> in the student's exam.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AnswerMappingGrid;
