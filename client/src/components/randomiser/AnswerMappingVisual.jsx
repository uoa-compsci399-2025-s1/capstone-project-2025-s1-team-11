// src/components/AnswerMappingVisual.jsx
import React from "react";
import { useSelector } from "react-redux";
import { selectExamData } from "../../store/exam/selectors";
import { Typography } from "antd";
const { Text } = Typography;

const DEFAULT_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

const AnswerMappingVisual = ({ mapping }) => {
  const examData = useSelector(selectExamData);
  const options = examData?.teleformOptions || DEFAULT_OPTIONS;

  if (!mapping || !mapping.length) return null;

  const letters = options.slice(0, mapping.length);

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
            <Text>{from}</Text>
            <Text style={{ fontSize: "1.2rem" }}>→</Text>
            <Text>{to}</Text>
          </div>
        );
      })}
    </div>
  );
};

export default AnswerMappingVisual;
