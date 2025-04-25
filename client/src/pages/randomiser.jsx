// src/pages/ExamFileManager.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Table, Card, Space, Typography, Switch, Select, Spin } from "antd";
import { regenerateShuffleMaps } from "../store/exam/examSlice"; // your existing reducer
import { selectExamData, selectAllQuestionsFlat } from "../store/exam/selectors";

const { Title, Text } = Typography;

const Randomiser = () => {
    // redux setup
    const dispatch = useDispatch();
    const exam = useSelector(selectExamData);
    const questions = useSelector(selectAllQuestionsFlat);
    // local ui state
    const [selectedVersion, setSelectedVersion] = useState(exam?.versions?.[0] || '');
    const [showRaw, setShowRaw] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [selectedSection, setSelectedSection] = useState("All");
    const [showQuestion, setShowQuestion] = useState(true);
    const [showAnswers, setShowAnswers] = useState(true);

    // function to handle shuffling answers for all questions
    const handleShuffleAnswers = () => {
      if (!exam) {
        console.error("No exam data available to shuffle");
        return;
      }
      setIsShuffling(true);
      setTimeout(() => {
        dispatch(regenerateShuffleMaps());
        setIsShuffling(false);
      }, 600);
    };

    // format mapping data for display in table
    const getShuffleMappingData = () => {
        if (!questions || questions.length === 0) return [];
        
        return questions.map((question) => {
            const { questionNumber, answerShuffleMaps } = question;
            
            if (!answerShuffleMaps || answerShuffleMaps.length === 0) {
                return [{
                    key: `q${questionNumber}-no-shuffle`,
                    questionNumber,
                    version: 'N/A',
                    mapping: 'No shuffle map available',
                    mappingDetails: 'No shuffle map available'
                }];
            }
            
            // create rows for each version of shuffle map
            return answerShuffleMaps.map((mapping, versionIndex) => ({
                key: `q${questionNumber}-v${versionIndex + 1}`,
                questionNumber,
                version: exam.versions[versionIndex],
                mapping: mapping.join(", "),
                // create map from original position to shuffled position
                mappingDetails: mapping
                    .map((pos, idx) => `${String.fromCharCode(65 + idx)} → ${String.fromCharCode(65 + pos)}`)
                    .join(", ")
            }));
        }).flat(); // flatten the nested arrays
    };

    // columns definition for the table display (currently not used in JSX)
    const columns = [
        {
            title: "Question",
            dataIndex: "questionNumber",
            key: "questionNumber",
            sorter: (a, b) => a.questionNumber - b.questionNumber,
        },
        {
            title: "Version",
            dataIndex: "version",
            key: "version",
        },
        {
            title: "Raw Mapping",
            dataIndex: "mapping",
            key: "mapping",
        },
        {
            title: "Position Mapping (Original → Shuffled)",
            dataIndex: "mappingDetails",
            key: "mappingDetails",
        }
    ];

    // main render of the component
    return (
      <div style={{ padding: "20px" }}>
        {/* page title */}
        <Title level={2}>Answer Randomiser</Title>

        {/* card containing shuffle button and description */}
        <Card style={{ marginBottom: "20px" }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {/* description text */}
            <Text>
              Shuffle answer options for all questions and versions of the exam.
              This will randomize the order of answers while respecting any locked positions.
            </Text>

            {/* button to trigger shuffle */}
            <Button type="primary" onClick={handleShuffleAnswers} disabled={!exam}>
              Shuffle All Answers
            </Button>

            {/* warning text if no exam data */}
            {!exam && (
              <Text type="warning">No exam data available. Please create or load an exam first.</Text>
            )}
          </Space>
        </Card>

        {/* card containing shuffle mappings and controls */}
        <Card title="Answer Shuffle Mappings">
          {/* dropdowns and switches to control displayed data */}
          <div style={{ marginBottom: 16 }}>
            <Space wrap>
              <Text strong>Version:</Text>
              <Select
                value={selectedVersion}
                onChange={(value) => setSelectedVersion(value)}
                style={{ width: 120 }}
              >
                {exam?.versions?.map((v, idx) => (
                  <Select.Option key={idx} value={v}>
                    {v}
                  </Select.Option>
                ))}
              </Select>
              <Space>
                <Text strong>Show Raw Mapping:</Text>
                <Switch checked={showRaw} onChange={(checked) => setShowRaw(checked)} />
              </Space>
              <Space>
                <Text strong>Show Question Text:</Text>
                <Switch checked={showQuestion} onChange={(checked) => setShowQuestion(checked)} />
              </Space>
              <Space>
                <Text strong>Show Answers:</Text>
                <Switch checked={showAnswers} onChange={(checked) => setShowAnswers(checked)} />
              </Space>
            </Space>
          </div>

          {/* section filter dropdown */}
          <div style={{ marginBottom: 16 }}>
            <Select
              value={selectedSection}
              onChange={setSelectedSection}
              style={{ width: 180 }}
            >
              <Select.Option value="All">All Sections</Select.Option>
              {/* couldnt get this to work... */}
            </Select>
          </div>

          {/* spinner while shuffling */}
          <Spin spinning={isShuffling}>
            {/* list of questions filtered by section */}
            <div>
              {questions
                .filter(q => selectedSection === "All" || q.section === selectedSection)
                .map((question) => {
                  // get index of selected version
                  const versionIndex = exam?.versions?.indexOf(selectedVersion);
                  // get shuffle mapping for this question and version
                  const mapping = question.answerShuffleMaps?.[versionIndex];

                  if (!mapping) return null;

                  // create position mapping string for display
                  const mappingDetails = mapping.map((pos, idx) =>
                    `${String.fromCharCode(65 + idx)} → ${String.fromCharCode(65 + pos)}`
                  ).join(", ");

                  // raw mapping string
                  const rawMap = mapping.join(", ");

                  return (
                    <Card
                      key={question.id}
                      type="inner"
                      title={`Question ${question.questionNumber}${question.section ? ` — ${question.section}` : ''}`}
                      style={{ marginBottom: 12 }}
                    >
                      {/* optionally show question text */}
                      {showQuestion && (
                        <Text style={{ display: "block", marginBottom: 8 }}>
                          <strong>Text:</strong> {question.contentText || question.questionText}
                        </Text>
                      )}
                      {/* optionally show shuffled answers */}
                      {showAnswers && question.answers?.length > 0 && mapping && (
                        <div style={{ marginBottom: 8 }}>
                          <Text strong>Shuffled Answers:</Text>
                          <ul style={{ paddingLeft: "1.5em", marginBottom: 0 }}>
                            {(() => {
                              // create array of answers in shuffled order
                              const shuffledAnswers = Array(mapping.length);
                              mapping.forEach((shuffledIndex, originalIndex) => {
                                shuffledAnswers[shuffledIndex] = question.answers?.[originalIndex];
                              });
                              // render shuffled answers list items
                              return shuffledAnswers.map((answer, idx) => (
                                <li key={idx}>
                                  <Text>
                                    {String.fromCharCode(65 + idx)}. {answer?.contentText || "[Missing Answer]"}
                                  </Text>
                                </li>
                              ));
                            })()}
                          </ul>
                        </div>
                      )}
                      {/* show either raw or position mapping */}
                      <Text>
                        <strong>{showRaw ? "Raw Mapping:" : "Position Mapping:"}</strong> {showRaw ? rawMap : mappingDetails}
                      </Text>
                    </Card>
                  );
                })}
            </div>
          </Spin>
        </Card>
      </div>
    );
};

export default Randomiser;