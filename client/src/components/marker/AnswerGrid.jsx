import React from "react";
import { theme } from "antd";

const OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const MAX_QUESTIONS = 50;

function decodeAnswerString(answerString) {
  const matrix = Array.from({ length: 5 }, () => []);

  for (let i = 0; i < MAX_QUESTIONS; i++) {
    const start = i * 2;
    const chunk = answerString.substring(start, start + 2);
    const decimalValue = parseInt(chunk || '00', 10);
    const binary = decimalValue.toString(2).padStart(5, '0');

    for (let j = 0; j < 5; j++) {
      matrix[j].push(binary[j] === '1');
    }
  }

  return matrix;
}

function bitmaskToBooleanArray(mask) {
  return mask.toString(2).padStart(5, '0').split('').map(b => b === '1');
}

const AnswerGrid = ({ answerString, answerKey }) => {
  const { token } = theme.useToken();
  const matrix = decodeAnswerString(answerString);

  const keyMatrix = answerKey
    ? Array.from({ length: 5 }, (_, opt) =>
      answerKey.map(mask => bitmaskToBooleanArray(mask)[opt])
    )
    : null;

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
          {Array.from({ length: MAX_QUESTIONS }, (_, i) => (
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
        {matrix.map((row, optionIndex) => (
          <tr key={OPTIONS[optionIndex]}>
            <td style={{
              padding: 4,
              textAlign: 'center',
              fontWeight: 'bold',
              border: `1px solid ${token.colorBorderSecondary}`
            }}>
              {OPTIONS[optionIndex]}
            </td>
            {row.map((isSelected, i) => {
              const isCorrect = keyMatrix?.[optionIndex]?.[i];

              let bg = token.colorBgContainer;
              if (isSelected && isCorrect) bg = token.colorSuccess;
              else if (isSelected && !isCorrect) bg = token.colorError;

              return (
                <td
                  key={i}
                  style={{
                    padding: 4,
                    textAlign: 'center',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    backgroundColor: bg
                  }}
                  title={
                    isSelected
                      ? isCorrect
                        ? 'Correct'
                        : 'Incorrect'
                      : ''
                  }
                >
                  {isSelected ? '⬛' : '⬜'}
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