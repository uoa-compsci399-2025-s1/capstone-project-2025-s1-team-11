// src/components/AnswerMappingGrid.jsx
import React from "react";

const AnswerMappingGrid = ({ mapping }) => {
  if (!mapping || !mapping.length) return null;

  const letters = Array.from({ length: mapping.length }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const inverseMapping = mapping.map((_, i) => mapping.indexOf(i));

    return (
        <div className="mapping-grid-container" style={{ marginTop: "12px" }}>
        <div style={{ 
            display: "flex",
            flexDirection: "column",
            gap: "5px"
        }}>
            <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            fontSize: "0.95rem"
            }}>
            <div style={{ 
                padding: "6px 12px", 
                backgroundColor: "#e6f7ff", 
                borderLeft: "4px solid #1890ff",
                borderRadius: "4px"
            }}>
                <strong>Original Position</strong> (answer in exam version template)
            </div>
            <div style={{ fontSize: "1.1rem" }}>→</div>
            <div style={{ 
                padding: "6px 12px", 
                backgroundColor: "#f6ffed", 
                borderLeft: "4px solid #52c41a",
                borderRadius: "2px" 
            }}>
                <strong>Randomized Position</strong> (answer in student's exam)
            </div>
            </div>
            
            {/* Example interpretation */}
            {mapping.length > 0 && (
                <div style={{ marginTop: "8px", fontStyle: "italic" }}>
                <p style={{ margin: "0 0 4px 0" }}>Example: Original answer <strong>{letters[0]}</strong> is now in position <strong>{letters[mapping[0]]}</strong> in the student's exam.</p>
                </div>
            )}
            <div style={{ 
            display: "grid", 
            gridTemplateColumns: `80px repeat(${mapping.length}, 50px)`,
            gap: "4px",
            fontSize: "0.9rem"
            }}>
            {/* Header row */}
            <div style={{ 
                gridColumn: "1 / 2", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontWeight: "bold",
                padding: "8px 4px",
                backgroundColor: "#fafafa",
                borderRadius: "4px"
            }}>
                Original →
            </div>
            
            {/* Column headers (A, B, C, etc.) */}
            {letters.map((letter, index) => (
                <div key={`header-${index}`} style={{ 
                gridColumn: `${index + 2} / ${index + 3}`,
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontWeight: "bold",
                backgroundColor: "#f6ffed",
                borderRadius: "4px",
                padding: "8px 4px",
                border: "1px solid #b7eb8f"
                }}>
                {letter}
                </div>
            ))}
            
            {/* Generate rows for each original answer */}
            {mapping.map((targetPos, originalIndex) => (
                <React.Fragment key={`row-${originalIndex}`}>
                {/* Row header (original letter) */}
                <div style={{ 
                    gridColumn: "1 / 2", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontWeight: "bold",
                    backgroundColor: "#e6f7ff",
                    borderRadius: "4px",
                    padding: "8px 4px",
                    border: "1px solid #91d5ff"
                }}>
                    {letters[originalIndex]}
                </div>
                
                {/* Cells for this row */}
                {letters.map((_, colIndex) => (
                    <div key={`cell-${originalIndex}-${colIndex}`} style={{ 
                    gridColumn: `${colIndex + 2} / ${colIndex + 3}`,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    backgroundColor: targetPos === colIndex ? "#1890ff" : "#ffffff",
                    color: targetPos === colIndex ? "#ffffff" : "#d9d9d9",
                    border: targetPos === colIndex ? "1px solid #096dd9" : "1px solid #d9d9d9",
                    borderRadius: "4px",
                    width: "50px",
                    height: "50px",
                    position: "relative"
                    }}>
                    {targetPos === colIndex && (
                        <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%",
                        gap: "2px"
                        }}>
                        <span style={{ 
                            fontSize: "0.9rem", 
                            lineHeight: 1
                        }}>✓</span>
                        <div style={{
                            fontSize: "0.65rem",
                            fontWeight: "bold",
                            lineHeight: 1
                        }}>
                            {letters[originalIndex]} → {letters[colIndex]}
                        </div>
                        </div>
                    )}
                    </div>
                ))}
                </React.Fragment>
            ))}
            </div>
        </div>
        </div>
    );
};

export default AnswerMappingGrid;