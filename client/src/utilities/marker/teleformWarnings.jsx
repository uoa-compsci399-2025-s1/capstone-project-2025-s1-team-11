import React from "react";
import { Alert, List, Typography } from "antd";

const { Text } = Typography;

/**
 * Check if a bitmask contains multiple selected options.
 */
function hasMultipleBitsSet(value) {
  return value !== 0 && (value & (value - 1)) !== 0;
}

/**
 * Generate a list of warnings from parsed teleform data.
 * @param {Array} parsedData - Array of student objects { studentId, answerString }
 * @returns {Array} - Array of warning messages
 */
function getMultipleAnswerWarnings(parsedData) {
  const warnings = [];

  parsedData.forEach(({ studentId, answerString }) => {
    const multiAnswerQuestions = [];

    for (let i = 0; i < answerString.length; i += 2) {
      const chunk = answerString.substring(i, i + 2);
      const value = parseInt(chunk, 10);
      const questionNum = i / 2 + 1;

      if (!isNaN(value) && hasMultipleBitsSet(value)) {
        multiAnswerQuestions.push(questionNum);
      }
    }

    if (multiAnswerQuestions.length > 0) {
      warnings.push(
        `Student ${studentId} selected multiple answers for Question(s): ${multiAnswerQuestions.join(', ')}`
      );
    }
  });

  return warnings;
}

/**
 * TeleformWarnings component
 * @param {Object} props
 * @param {Array} props.parsedData - Parsed Teleform student data
 */
const TeleformWarnings = ({ parsedData }) => {
  const warnings = getMultipleAnswerWarnings(parsedData);

  if (warnings.length === 0) return null;

  return (
    <Alert
      message="Multiple Answer Selections Detected"
      description={
        <List
          size="small"
          bordered
          dataSource={warnings}
          renderItem={(item) => <List.Item><Text type="warning">{item}</Text></List.Item>}
        />
      }
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};

export default TeleformWarnings;