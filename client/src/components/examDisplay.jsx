// src/components/ExamDisplay.jsx
import React from "react";
import { Button, Alert, Input, Space, Table, Typography, Card } from "antd";

const ExamDisplay = ({ exam, onAddQuestion }) => {
  if (!exam) {
    return <div>No exam loaded.</div>;
  }
  return (
    <div>
      {exam && (
        <Card
          title={exam.title}
          extra={<span>Date: {exam.date}</span>}
          style={{ marginTop: 24 }}
        >
          <Typography.Title level={3} style={{ margin: 0, paddingBottom: 8 }}>
            Questions:
          </Typography.Title>
          <Table
            dataSource={exam.questions.map((q, index) => ({
              key: q.id,
              number: index + 1,
              questionText: q.questionText,
              answer: q.answer,
              optionA: q.options?.[0] || "",
              optionB: q.options?.[1] || "",
              optionC: q.options?.[2] || "",
              optionD: q.options?.[3] || "",
            }))}
            columns={[
              { title: "#", dataIndex: "number", key: "number" },
              {
                title: "Question",
                dataIndex: "questionText",
                key: "questionText",
              },
              { title: "Answer", dataIndex: "answer", key: "answer" },
              { title: "Option A", dataIndex: "optionA", key: "optionA" },
              { title: "Option B", dataIndex: "optionB", key: "optionB" },
              { title: "Option C", dataIndex: "optionC", key: "optionC" },
              { title: "Option D", dataIndex: "optionD", key: "optionD" },
            ]}
            pagination={false}
          />
        </Card>
      )}
      <Space style={{ marginTop: "16px" }}>
        <Button type="dashed" onClick={onAddQuestion}>
          Add Question
        </Button>
      </Space>
      {/*--
            <Space style={{ marginTop: '16px' }}>
                <Button type="primary" onClick={handleOpenFile}>
                    Open Exam File
                </Button>
                <Button onClick={handleSaveFile}>Save Exam File</Button>
            </Space>
            --*/}
    </div>
  );
};

export default ExamDisplay;
