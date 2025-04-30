// src/pages/ExamFileManager.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Table, Card, Space, Typography, Switch, Select, Spin, Pagination, Tabs } from "antd";
import { regenerateShuffleMaps } from "../store/exam/examSlice";
import { selectExamData, selectAllQuestionsFlat } from "../store/exam/selectors";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

import MapDisplay from "../components/mapDisplay";

const Randomiser = () => {
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);
  const questions = useSelector(selectAllQuestionsFlat);
  const [selectedVersion, setSelectedVersion] = useState(exam?.versions?.[0] || '');
  const [showRaw, setShowRaw] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedSection, setSelectedSection] = useState("All");
  const [showQuestion, setShowQuestion] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [displayMode, setDisplayMode] = useState("visual"); 

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
    <div style={{ padding: "20px" }}>
      <Title level={2}>Answer Randomiser</Title>

      <Card style={{ marginBottom: "20px" }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text>
            Shuffle answer options for all questions and versions of the exam.
            This will randomize the order of answers while respecting any locked positions.
          </Text>
          <Button 
            type="primary" 
            onClick={handleShuffleAnswers} 
            disabled={!exam}
          >
            Shuffle All Answers
          </Button>
          {!exam && (
            <Text type="warning">No exam data available. Please create or load an exam first.</Text>
          )}
        </Space>
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

              const mappingDetails = mapping.map((pos, idx) =>
                `${String.fromCharCode(65 + idx)} → ${String.fromCharCode(65 + pos)}`
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
                       {question.contentText || question.questionText}
                    </Text>
                  )}
                  {showAnswers && question.answers?.length > 0 && mapping && (
                    <div style={{ marginBottom: 8 }}>                      
                      <ul style={{ paddingLeft: "1.5em", marginBottom: 0 }}>
                        {mapping.map((shuffledIndex, originalIndex) => (
                          <li key={originalIndex}>
                            <Text>
                              {String.fromCharCode(65 + originalIndex)}. {question.answers?.[shuffledIndex]?.contentText || "[Missing Answer]"}
                            </Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                                    {displayMode === "visual" ? (
                    <MapDisplay 
                      question={question} 
                      selectedVersion={selectedVersion} 
                      exam={exam} 
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
    </div>
  );
};

export default Randomiser;