import React from "react";
import { theme } from "antd";
import { useSelector } from "react-redux";
import { markQuestion } from "../../utilities/marker/examMarker";
import { selectExamData } from "../../store/exam/selectors";
import { DEFAULT_OPTIONS } from '../../constants/answerOptions';

function decodeAnswerString(answerString, optionsLength) {
  const maxQuestions = Math.floor(answerString.length / 2);
  const matrix = Array.from({ length: optionsLength }, () => []);

  for (let i = 0; i < maxQuestions; i++) {
    const start = i * 2;
    const chunk = answerString.substring(start, start + 2);
    const decimalValue = parseInt(chunk, 10) || 0;
    const binary = decimalValue.toString(2).padStart(optionsLength, '0');

    for (let j = 0; j < optionsLength; j++) {
      matrix[j].push(binary[optionsLength - 1 - j] === '1'); // bit 0 = A, bit n-1 = last option
    }
  }

  return matrix;
}

const AnswerGrid = ({ answerString = '', answerKeyString = '' }) => {
  const { token } = theme.useToken();
  const examData = useSelector(selectExamData);
  const options = examData?.teleformOptions || DEFAULT_OPTIONS;
  const optionsLength = options.length;
  
  //console.log('TeleformOptions from exam:', examData?.teleformOptions);
  //console.log('Options being used in grid:', options);

  const selectedMatrix = decodeAnswerString(answerString, optionsLength);
  const correctMatrix = answerKeyString ? decodeAnswerString(answerKeyString, optionsLength) : null;
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
        {options.map((label, rowIndex) => (
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

        {/* Correct? row */}
        {answerString && (
          <tr key="correctness">
            <td style={{
              padding: 4,
              textAlign: 'center',
              fontWeight: 'bold',
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorFillSecondary
            }}>
              Correct?
            </td>
            {Array.from({ length: maxQuestions }, (_, colIndex) => {
              const correctBitmask = correctMatrix
                ? correctMatrix.reduce((acc, val, i) => val[colIndex] ? acc | (1 << i) : acc, 0)
                : 0;

              const selectedBitmask = selectedMatrix
                ? selectedMatrix.reduce((acc, val, i) => val[colIndex] ? acc | (1 << i) : acc, 0)
                : 0;

              const { isCorrect } = markQuestion(correctBitmask, selectedBitmask);

              return (
                <td
                  key={`correct-${colIndex}`}
                  style={{
                    padding: 4,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    backgroundColor: isCorrect ? token.colorSuccess : token.colorError
                  }}
                >
                  {isCorrect ? '✔️' : '❌'}
                </td>
              );
            })}
          </tr>
        )}
        </tbody>
      </table>
    </div>
  );
};

export default AnswerGrid;