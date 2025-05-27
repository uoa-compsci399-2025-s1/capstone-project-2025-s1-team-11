// src/pages/ExamFileManager.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Space, Typography, Switch, Select, Spin, Pagination, theme, Divider } from "antd";
import { regenerateShuffleMaps, importMarkingKey } from "../store/exam/examSlice";
import { selectExamData, selectAllQuestionsFlat } from "../store/exam/selectors";
import MapDisplay from "../components/randomiser/mapDisplay";
import { EmptyExam } from "../components/shared/emptyExam.jsx";
import { htmlToText } from "../utilities/textUtils.js";
import { importMarkingKeyFile, processMarkingKeyFile } from "../services/markingKeyImportService";
import useMessage from "../hooks/useMessage.js";

const { Title, Text, Paragraph } = Typography;

const Randomiser = () => {
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);
  const questions = useSelector(selectAllQuestionsFlat);
  const { token } = theme.useToken();
  const message = useMessage();

  const [selectedVersion, setSelectedVersion] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isImportingKey, setIsImportingKey] = useState(false);
  const [selectedSection, setSelectedSection] = useState("All");
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [displayMode, setDisplayMode] = useState("visual");
  const [visualStyle, setVisualStyle] = useState("grid");

  const [pagination, setPagination] = useState({current: 1, pageSize: 10, });

  // Update selectedVersion when exam changes
  useEffect(() => {
    if (exam?.versions?.length > 0) {
      setSelectedVersion(exam.versions[0]);
    } else {
      setSelectedVersion('');
    }
  }, [exam]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [selectedSection]);

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

  // New function to handle importing marking key
  const handleImportMarkingKey = async () => {
    if (!exam) {
      message.error("No exam data available to import marking key.");
      return;
    }

    setIsImportingKey(true);
    try {
      // Show file picker
      const file = await importMarkingKeyFile();
      
      if (!file) {
        message.info("Marking key import cancelled.");
        setIsImportingKey(false);
        return;
      }
      
      // Process the file
      const markingKeyData = await processMarkingKeyFile(file);
      
      // Update the exam with the marking key data
      dispatch(importMarkingKey(markingKeyData));
      
      message.success("Marking key imported successfully.");
    } catch (error) {
      console.error("Error importing marking key:", error);
      message.error(`Failed to import marking key: ${error.message}`);
    } finally {
      setIsImportingKey(false);
    }
  };

  // calculate paginated questions
  const filteredQuestions = questions.filter(q =>
    selectedSection === "All" || q.section === selectedSection
  );
  const { current, pageSize } = pagination;
  const paginatedQuestions = filteredQuestions.slice(
    (current - 1) * pageSize,
    current * pageSize
  );

  // Helper function to find question location in exam body
  const findQuestionLocation = (questionId) => {
    if (!exam?.examBody) return {};
    
    for (let examBodyIndex = 0; examBodyIndex < exam.examBody.length; examBodyIndex++) {
      const item = exam.examBody[examBodyIndex];
      if (item.type === 'section') {
        for (let questionsIndex = 0; questionsIndex < item.questions.length; questionsIndex++) {
          if (item.questions[questionsIndex].id === questionId) {
            return { examBodyIndex, questionsIndex };
          }
        }
      } else if (item.type === 'question' && item.id === questionId) {
        return { examBodyIndex };
      }
    }
    return {};
  };

  return (
    <>
      <Typography.Title level={1}>MCQ Randomiser</Typography.Title>
      <Divider />
          <Card style={{ marginBottom: "20px" }}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Text>
                Shuffle answer options for all questions and versions of the exam.
                This will randomize the order of answers while respecting any locked positions.
              </Text>

              <div style={{
                marginTop: "12px",
                fontSize: "0.9rem",
                padding: "12px",
                backgroundColor: token.colorBgContainer,
                borderRadius: "6px",
                borderLeft: `4px solid ${token.colorPrimary}`
              }}>
                <Text strong>How to read this grid:</Text>
                <Paragraph style={{ marginBottom: 4 }}>
                  <span style={{
                    backgroundColor: token.colorInfoBg,
                    padding: "2px 4px",
                    borderRadius: "3px"
                  }}>
                    Row
                  </span> = Original answer position in template. (A, B, C...)
                </Paragraph>
                <Paragraph style={{ marginBottom: 4 }}>
                  <span style={{
                    backgroundColor: token.colorSuccessBg,
                    padding: "2px 4px",
                    borderRadius: "3px"
                  }}>
                    Column
                  </span> = Randomised position in student's exam. (A, B, C...)
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  <span style={{
                    backgroundColor: token.colorPrimary,
                    color: token.colorTextLightSolid,
                    padding: "2px 4px",
                    borderRadius: "3px"
                  }}>
                    Blue checkmarks
                  </span> show where each original answer appears in the randomised exam.
                </Paragraph>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                fontSize: "0.85rem",
              }}>
                <div style={{
                  padding: "4px 8px",
                  backgroundColor: token.colorInfoBg,
                  borderLeft: `4px solid ${token.colorPrimary}`,
                  borderRadius: "4px"
                }}>
                  <strong>Original Position</strong>
                </div>
                <Text style={{ fontSize: "1rem" }}>→</Text>
                <div style={{
                  padding: "4px 8px",
                  backgroundColor: token.colorSuccessBg,
                  borderLeft: `4px solid ${token.colorSuccess}`,
                  borderRadius: "2px"
                }}>
                  <strong>Randomized Position</strong>
                </div>
              </div>

              {!exam && (
                <Text type="warning">
                  No exam data available. Please create or load an exam first.
                </Text>
              )}
            </Space>

            <div style={{ 
              marginTop: "16px", 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <Button
                type="primary"
                onClick={handleShuffleAnswers}
                loading={isShuffling}
                disabled={!exam}
              >
                Shuffle All Answers
              </Button>
              
              <Button
                type="default"
                onClick={handleImportMarkingKey}
                loading={isImportingKey}
                disabled={!exam}
                style={{
                  borderColor: token.colorPrimary,
                  color: token.colorPrimary
                }}
              >
                Import Marking Key
              </Button>
            </div>
          </Card>

          <Card title="Answer Shuffle Mappings">
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Text strong>Version:</Text>
                <Select
                  value={selectedVersion}
                  onChange={setSelectedVersion}
                  style={{ width: 120 }}
                >
                  {exam?.versions?.map((v, idx) => (
                    <Select.Option key={idx} value={v}>{v}</Select.Option>
                  ))}
                </Select>

                <Text strong>Display Mode:</Text>
                <Select
                  value={displayMode}
                  onChange={setDisplayMode}
                  style={{ width: 150 }}
                >
                  <Select.Option value="visual">Visual Mapping</Select.Option>
                  <Select.Option value="text">Text Mapping</Select.Option>
                </Select>

                {displayMode === "visual" && (
                  <Space>
                    <Text strong>Visualization Style:</Text>
                    <Select
                      value={visualStyle}
                      onChange={setVisualStyle}
                      style={{ width: 120 }}
                    >
                      <Select.Option value="grid">Grid View</Select.Option>
                      <Select.Option value="arrows">Arrow View</Select.Option>
                    </Select>
                  </Space>
                )}

                {displayMode === "text" && (
                  <Space>
                    <Text strong>Show Raw Mapping:</Text>
                    <Switch checked={showRaw} onChange={setShowRaw} />
                  </Space>
                )}

                <Space>
                  <Text strong>Show Question Text:</Text>
                  <Switch checked={showQuestion} onChange={setShowQuestion} />
                </Space>
                <Space>
                  <Text strong>Show Answers:</Text>
                  <Switch checked={showAnswers} onChange={setShowAnswers} />
                </Space>
                <Space>
                  <Text strong>Answer Controls:</Text>
                  <Switch checked={showControls} onChange={setShowControls} />
                </Space>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Select
                value={selectedSection}
                onChange={setSelectedSection}
                style={{ width: 180 }}
              >
                <Select.Option value="All">All Sections</Select.Option>
                {[...new Set(questions.map(q => q.section))].filter(Boolean).map(section => (
                  <Select.Option key={section} value={section}>{section}</Select.Option>
                ))}
              </Select>
            </div>

            <Spin spinning={isShuffling}>
              <div>
                {paginatedQuestions.map((question) => {
                  const versionIndex = exam?.versions?.indexOf(selectedVersion) ?? 0;
                  const mapping = question.answerShuffleMaps?.[versionIndex];

                  if (!mapping) return null;

                  const options = exam?.teleformOptions || ['A', 'B', 'C', 'D', 'E'];
                  const mappingDetails = mapping.map((pos, idx) =>
                    `${options[idx]} → ${options[pos]}`
                  ).join(", ");
                  const rawMap = mapping.join(", ");
                  const location = findQuestionLocation(question.id);

                  return (
                    <Card
                      key={question.id}
                      type="inner"
                      title={`Question ${question.questionNumber}${question.section ? ` — ${question.section}` : ''}`}
                      style={{ marginBottom: 12 }}
                    >
                      {showQuestion && (
                        <Text style={{ display: "block", marginBottom: 8 }}>
                          {htmlToText(question.contentFormatted)}
                        </Text>
                      )}
                      {displayMode === "visual" ? (
                        <MapDisplay
                          question={question}
                          selectedVersion={selectedVersion}
                          exam={exam}
                          displayStyle={visualStyle}
                          examBodyIndex={location.examBodyIndex}
                          questionsIndex={location.questionsIndex}
                          showAnswers={showAnswers}
                          showControls={showControls}
                        />
                      ) : (
                        <Text>
                          <strong>{showRaw ? "Raw Mapping:" : "Position Mapping:"}</strong> {showRaw ? rawMap : mappingDetails}
                        </Text>
                      )}
                    </Card>
                  );
                })}
              </div>
              <EmptyExam/>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={filteredQuestions.length}
                onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
                style={{ marginTop: 16, textAlign: "center" }}
                showSizeChanger={false}
              />
            </Spin>
          </Card>
      </>
  );
};

export default Randomiser;