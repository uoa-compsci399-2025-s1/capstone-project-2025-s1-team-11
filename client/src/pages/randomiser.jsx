// src/pages/ExamFileManager.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Space, Typography, Switch, Select, Spin, Pagination } from "antd";
import { regenerateShuffleMaps } from "../store/exam/examSlice";
import { selectExamData, selectAllQuestionsFlat } from "../store/exam/selectors";

const { Title, Text } = Typography;

const Randomiser = () => {
  // Redux setup
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);
  const questions = useSelector(selectAllQuestionsFlat);

  // Local UI state
  const [selectedVersion, setSelectedVersion] = useState(exam?.versions?.[0] || '');
  const [showRaw, setShowRaw] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedSection, setSelectedSection] = useState("All");
  const [showQuestion, setShowQuestion] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Show 5 questions per page

  // Shuffle answers handler
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

  // Filter and paginate questions
  const filteredQuestions = questions.filter(q => 
    selectedSection === "All" || q.section === selectedSection
  );
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
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
            <Space>
              <Text strong>Show Raw Mapping:</Text>
              <Switch checked={showRaw} onChange={setShowRaw} />
            </Space>
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
            {/* Original section filter (unchanged) */}
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
                      <strong>Text:</strong> {question.contentText || question.questionText}
                    </Text>
                  )}
                  {showAnswers && question.answers?.length > 0 && mapping && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Shuffled Answers:</Text>
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
                  <Text>
                    <strong>{showRaw ? "Raw Mapping:" : "Position Mapping:"}</strong> {showRaw ? rawMap : mappingDetails}
                  </Text>
                </Card>
              );
            })}
          </div>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredQuestions.length}
            onChange={(page) => setCurrentPage(page)}
            style={{ marginTop: 16, textAlign: "center" }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Randomiser;