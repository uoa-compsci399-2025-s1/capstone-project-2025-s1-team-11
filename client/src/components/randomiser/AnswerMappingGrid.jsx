// src/components/AnswerMappingGrid.jsx
import React from "react";
import { Typography, theme } from "antd";
import { useSelector } from "react-redux";
import { selectExamData } from "../../store/exam/selectors";
import AnswerControls from "../randomiser/AnswerControls";
import { htmlToText } from "../../utilities/textUtils";
import { DEFAULT_OPTIONS } from '../../constants/answerOptions';

const { Text, Paragraph } = Typography;

const AnswerMappingGrid = ({ mapping, question, examBodyIndex, questionsIndex, showAnswers, showControls }) => {
  const examData = useSelector(selectExamData);
  const options = examData?.teleformOptions || DEFAULT_OPTIONS;
  const { token } = theme.useToken();

  if (!mapping || !mapping.length) return null;

  const letters = options.slice(0, mapping.length);

  const columnStyles = {
    header: {
      height: "32px",
      padding: "6px",
      textAlign: "center",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    cell: {
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }
  };

  const originalHeaderStyle = {
    ...columnStyles.header,
    whiteSpace: "nowrap",
    backgroundColor: token.colorInfoBg,
    border: `1px solid ${token.colorInfoBorder}`,
    borderRadius: "4px",
  };

  const randomizedHeaderStyle = {
    ...columnStyles.header,
    backgroundColor: token.colorSuccessBg,
    border: `1px solid ${token.colorSuccessBorder}`,
    borderRadius: "4px",
  };

  return (
    <div className="mapping-grid-container" style={{ marginTop: "12px" }}>
      {/* Main Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: showControls 
          ? "70px 100px auto minmax(0, 1fr)" 
          : "auto minmax(0, 1fr)", 
        gap: "24px", 
        alignItems: "start",
        width: "100%"
      }}>
        {/* Correct Column - Only show if showControls is true */}
        {showControls && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={columnStyles.header}>Correct</div>
            {letters.map((_, rowIndex) => (
              <div key={rowIndex} style={columnStyles.cell}>
                <AnswerControls.Checkbox
                  question={question}
                  answerIndex={rowIndex}
                  examBodyIndex={examBodyIndex}
                  questionsIndex={questionsIndex}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Map-to Column - Only show if showControls is true */}
        {showControls && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={columnStyles.header}>Map-to</div>
            {letters.map((_, rowIndex) => (
              <div key={rowIndex} style={columnStyles.cell}>
                <AnswerControls.Select
                  question={question}
                  answerIndex={rowIndex}
                  examBodyIndex={examBodyIndex}
                  questionsIndex={questionsIndex}
                />
              </div>
            ))}
          </div>
        )}

        {/* Mapping Grid Column */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          width: "fit-content"
        }}>
          {/* Headers */}
          <div style={{ 
            display: "grid",
            gridTemplateColumns: `70px repeat(${letters.length}, 32px)`,
            gap: "2px",
            height: "32px"
          }}>
            <div style={originalHeaderStyle}>
            Original ↓
            </div>
            {letters.map((letter, i) => (
              <div key={i} style={randomizedHeaderStyle}>
                {letter}
              </div>
            ))}
          </div>

          {/* Mapping Rows */}
          {letters.map((letter, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "grid",
                gridTemplateColumns: `70px repeat(${letters.length}, 32px)`,
                gap: "2px",
                height: "32px"
              }}
            >
              <div style={originalHeaderStyle}>
              {letter}
              </div>
              {letters.map((_, colIndex) => (
                <div
                  key={colIndex}
                    style={{
                    ...columnStyles.cell,
                    backgroundColor: mapping[rowIndex] === colIndex ? token.colorPrimary : token.colorBgContainer,
                    color: mapping[rowIndex] === colIndex ? token.colorTextLightSolid : token.colorTextDisabled,
                    border: `1px solid ${mapping[rowIndex] === colIndex ? token.colorPrimaryBorder : token.colorBorder}`,
                        borderRadius: "4px",
                    }}
                >
                  {mapping[rowIndex] === colIndex ? `${letter}→${letters[colIndex]}` : ""}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Answer Text Column */}
        {showAnswers && (
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            minWidth: 0,
          }}>
            <div style={columnStyles.header}></div>
            {letters.map((_, rowIndex) => (
              <div key={rowIndex} style={{ ...columnStyles.cell, justifyContent: "flex-start", padding: "0 8px" }}>
                <Text ellipsis style={{ 
                  width: "100%",
                  color: question.answers[rowIndex]?.correct ? token.colorSuccess : 'inherit'
                }}>
                  {question.answers[rowIndex]?.contentFormatted ? htmlToText(question.answers[rowIndex].contentFormatted) : ''}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Example text */}
      <Paragraph type="secondary" italic style={{ marginTop: 12, fontSize: "0.85rem" }}>
        Example: Original answer <strong>{letters[0]}</strong> is now in position <strong>{letters[mapping[0]]}</strong> in the student's exam.
      </Paragraph>
    </div>
  );
};

export default AnswerMappingGrid;
