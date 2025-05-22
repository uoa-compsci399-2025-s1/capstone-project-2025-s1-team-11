// src/pages/ExamFileManager.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Space, Typography, Switch, Select, Spin, Pagination, theme, Row, Col, Divider} from "antd";
import { regenerateShuffleMaps } from "../store/exam/examSlice";
import { selectExamData, selectAllQuestionsFlat } from "../store/exam/selectors";
import MapDisplay from "../components/mapDisplay";
import ExamSidebar from "../components/ExamSidebar";
import { EmptyExam } from "../components/shared/emptyExam.jsx";

const { Title, Text, Paragraph } = Typography;

const Randomiser = () => {
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);
  const questions = useSelector(selectAllQuestionsFlat);
  const { token } = theme.useToken();
  const [currentItemId, setCurrentItemId] = useState(null);

  const [selectedVersion, setSelectedVersion] = useState(exam?.versions?.[0] || '');
  const [showRaw, setShowRaw] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedSection, setSelectedSection] = useState("All");
  const [showQuestion, setShowQuestion] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [displayMode, setDisplayMode] = useState("visual");
  const [visualStyle, setVisualStyle] = useState("grid");

  const [pagination, setPagination] = useState({current: 1, pageSize: 10, });
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

  // Handle navigation from sidebar
  const handleNavigateToItem = (itemId, itemType) => {
    setCurrentItemId(itemId);
    // Find the section that contains this item and select it
    if (itemType === 'question') {
      const question = questions.find(q => q.id === itemId);
      if (question) {
        setSelectedSection(question.section || "All");
      }
    } else if (itemType === 'section') {
      const section = exam.examBody.find(item => item.id === itemId);
      if (section) {
        setSelectedSection(section.sectionTitle || "All");
      }
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

  return (
    <>
      <Typography.Title level={1}>MCQ Randomiser</Typography.Title>
      <Divider />
    <Row gutter={24}>
      <Col xs={24} lg={18}>
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

            <div style={{ marginTop: "16px" }}>
              <Button
                type="primary"
                onClick={handleShuffleAnswers}
                disabled={!exam}
              >
                Shuffle All Answers
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

                  return (
                    <Card
                      key={question.id}
                      type="inner"
                      title={`Question ${question.questionNumber}${question.section ? ` — ${question.section}` : ''}`}
                      style={{ marginBottom: 12 }}
                    >
                      {showQuestion && (
                        <Text style={{ display: "block", marginBottom: 8 }}>
                          {question.contentText}
                        </Text>
                      )}
                      {showAnswers && question.answers?.length > 0 && mapping && (
                        <div style={{ marginBottom: 8 }}>
                          <ul style={{ paddingLeft: "1.5em", marginBottom: 0 }}>
                            {mapping.map((shuffledIndex, originalIndex) => {
                              const answer = question.answers?.[shuffledIndex];
                              if (!answer?.contentText) return null;
                              return (
                                <li key={originalIndex}>
                                  <Text>
                                    {String.fromCharCode(65 + originalIndex)}. {answer.contentText}
                                  </Text>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {displayMode === "visual" ? (
                        <MapDisplay
                          question={question}
                          selectedVersion={selectedVersion}
                          exam={exam}
                          displayStyle={visualStyle}
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

      </Col>
      <Col xs={24} lg={6}>
        <ExamSidebar 
          exam={exam} 
          currentItemId={currentItemId}
          onNavigateToItem={handleNavigateToItem}
        />
      </Col>
      </Row>
      </>
  );
};

export default Randomiser;