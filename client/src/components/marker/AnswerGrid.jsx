import React from "react";
import { theme } from "antd";

const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

function decodeAnswerString(answerString) {
  const maxQuestions = Math.floor(answerString.length / 2);
  const matrix = Array.from({ length: 5 }, () => []);

  for (let i = 0; i < maxQuestions; i++) {
    const start = i * 2;
    const chunk = answerString.substring(start, start + 2);
    const decimalValue = parseInt(chunk, 10) || 0;
    
    // Map each bit position directly to the corresponding option
    // bit 0 (value 1) = A
    // bit 1 (value 2) = B
    // bit 2 (value 4) = C
    // bit 3 (value 8) = D
    // bit 4 (value 16) = E
    
    // Create a new array for each question with the corresponding bit values
    matrix[0].push((decimalValue & 1) === 1);  // Option A (bit 0)
    matrix[1].push((decimalValue & 2) === 2);  // Option B (bit 1)
    matrix[2].push((decimalValue & 4) === 4);  // Option C (bit 2)
    matrix[3].push((decimalValue & 8) === 8);  // Option D (bit 3)
    matrix[4].push((decimalValue & 16) === 16); // Option E (bit 4)
  }

  return matrix;
}

const AnswerGrid = ({ answerString = '', answerKeyString = '' }) => {
  const { token } = theme.useToken();

  const selectedMatrix = decodeAnswerString(answerString);
  const correctMatrix = answerKeyString ? decodeAnswerString(answerKeyString) : null;

  const maxQuestions = selectedMatrix[0]?.length || correctMatrix?.[0]?.length || 0;

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${token.colorBorderSecondary}`, marginTop: 8 }}>
      <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
        <thead>
        <tr>
          <th style={{
            padding: 4,
            textAlign: 'center',
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorFillSecondary
          }}>
            Option
          </th>
          {Array.from({ length: maxQuestions }, (_, i) => (
            <th key={i} style={{
              padding: 4,
              textAlign: 'center',
              border: `1px solid ${token.colorBorderSecondary}`
            }}>
              Q{i + 1}
            </th>
          ))}
        </tr>
        </thead>
        <tbody>
        {OPTIONS.map((label, rowIndex) => (
          <tr key={label}>
            <td style={{
              padding: 4,
              textAlign: 'center',
              fontWeight: 'bold',
              border: `1px solid ${token.colorBorderSecondary}`
            }}>
              {label}
            </td>
            {Array.from({ length: maxQuestions }, (_, colIndex) => {
              const isCorrect = correctMatrix?.[rowIndex]?.[colIndex];
              const isSelected = selectedMatrix?.[rowIndex]?.[colIndex];

              const bg = isCorrect ? token.colorSuccess : token.colorBgContainer;
              const symbol = isSelected ? '✔️' : '⬜';

              return (
                <td
                  key={colIndex}
                  style={{
                    padding: 4,
                    textAlign: 'center',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    backgroundColor: bg
                  }}
                >
                  {symbol}
                </td>
              );
            })}
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnswerGrid;