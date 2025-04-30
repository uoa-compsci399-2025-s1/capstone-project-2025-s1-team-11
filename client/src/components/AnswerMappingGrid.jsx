import React from "react";

const AnswerMappingGrid = ({ mapping }) => {
  if (!mapping || !mapping.length) return null;

  const letters = Array.from({ length: mapping.length }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const rowHeight = 48; // px
  const circleSize = 36; // diameter
  const leftX = 40;
  const rightX = 220;

  return (
    <div className="relative w-full max-w-md">
      {/* Grid with two columns: Original and Target */}
      <div className="grid grid-cols-2 gap-32 relative z-10">
        <div className="flex flex-col space-y-4 items-end">
          {letters.map((letter, i) => (
            <div
              key={i}
              className="w-9 h-9 flex items-center justify-center bg-blue-100 text-blue-800 font-bold rounded-full"
            >
              {letter}
            </div>
          ))}
        </div>
        <div className="flex flex-col space-y-4 items-start">
          {letters.map((letter, i) => (
            <div
              key={i}
              className="w-9 h-9 flex items-center justify-center bg-green-100 text-green-800 font-bold rounded-full"
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* SVG arrows connecting columns */}
      <svg
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="#4B5563" />
          </marker>
        </defs>

        {mapping.map((targetIndex, originalIndex) => {
          const y1 = originalIndex * (rowHeight + 16) + circleSize / 2;
          const y2 = targetIndex * (rowHeight + 16) + circleSize / 2;
          return (
            <line
              key={originalIndex}
              x1={leftX + circleSize}
              y1={y1}
              x2={rightX}
              y2={y2}
              stroke="#4B5563"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default AnswerMappingGrid;
