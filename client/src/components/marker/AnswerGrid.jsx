import React from "react";

const OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const MAX_QUESTIONS = 50;

function decodeAnswerString(answerString) {
  const matrix = Array.from({ length: 5 }, () => []);

  for (let i = 0; i < MAX_QUESTIONS; i++) {
    const start = i * 2;
    const chunk = answerString.substring(start, start + 2);
    const decimalValue = parseInt(chunk || '00', 10); // fallback to 0 if missing
    const binary = decimalValue.toString(2).padStart(5, '0');

    for (let j = 0; j < 5; j++) {
      matrix[j].push(binary[j] === '1');
    }
  }

  return matrix;
}

const AnswerGrid = ({ answerString }) => {
  const matrix = decodeAnswerString(answerString);

  return (
    <div style={{ overflowX: "auto", border: "1px solid #ddd", marginTop: 8 }}>
      <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
        <thead>
        <tr>
          <th style={{ padding: 4, textAlign: 'center', border: '1px solid #ccc', background: '#f7f7f7' }}>Option</th>
          {Array.from({ length: MAX_QUESTIONS }, (_, i) => (
            <th key={i} style={{ padding: 4, textAlign: 'center', border: '1px solid #ccc' }}>
              Q{i + 1}
            </th>
          ))}
        </tr>
        </thead>
        <tbody>
        {matrix.map((row, optionIndex) => (
          <tr key={OPTIONS[optionIndex]}>
            <td style={{ padding: 4, textAlign: 'center', fontWeight: 'bold', border: '1px solid #ccc' }}>
              {OPTIONS[optionIndex]}
            </td>
            {row.map((isSelected, i) => (
              <td
                key={i}
                style={{
                  padding: 4,
                  textAlign: 'center',
                  border: '1px solid #ccc',
                  backgroundColor: isSelected ? '#1890ff' : '#fff'
                }}
              >
                {isSelected ? '⬛' : '⬜'}
              </td>
            ))}
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnswerGrid;