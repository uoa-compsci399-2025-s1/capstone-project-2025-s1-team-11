import React, { useEffect, useState } from "react";
import { Typography, Table } from "antd";

export const ExamDisplay = ({ exam }) => {
  const [examItems, setExamItems] = useState([]);

  useEffect(() => {
    if (!exam || !Array.isArray(exam.examBody)) return;
    const items = [];

    exam.examBody.forEach((entry) => {
      const type = (entry.type || "").toLowerCase();

      if (type === "section") {
        items.push({
          id: entry.id,
          type: "section",
          title: entry.title,
          subtext: entry.subtext,
        });

        (entry.questions || []).forEach((q) => {
          items.push({
            ...q,
            type: "question",
            section: entry.title,
            questionText: q.questionText || q.contentText,
            options: q.options || (q.answers || []).map((a) => a.contentText),
            correctIndex: q.correctIndex ?? (q.answers || []).findIndex((a) => a.correct),
          });
        });
      } else if (type === "question") {
        items.push({
          ...entry,
          type: "question",
          questionText: entry.questionText || entry.contentText,
          options: entry.options || (entry.answers || []).map((a) => a.contentText),
          correctIndex: entry.correctIndex ?? (entry.answers || []).findIndex((a) => a.correct),
        });
      }
    });

    setExamItems(items);
  }, [exam]);

  if (!exam || !Array.isArray(exam.examBody)) {
    return <div>Please open an exam or create a new file.</div>;
  }

  return (
    <div>
      <Typography.Title level={3}>{exam.examTitle}</Typography.Title>
      <Typography.Text type="secondary">
        {[exam.courseCode, exam.courseName].filter(Boolean).join(" - ")} {exam.semester} {exam.year}
      </Typography.Text>

      <Table
        columns={[
          {
            title: "Type",
            dataIndex: "type",
            key: "type",
          },
          {
            title: "Section",
            dataIndex: "section",
            key: "section",
          },
          {
            title: "Title / Question",
            dataIndex: "titleOrQuestion",
            key: "titleOrQuestion",
            render: (_, record) =>
              record.type === "section" ? (
                <div>
                  <strong>{record.title}</strong>
                  {record.subtext && <div style={{ fontStyle: "italic", color: "#888" }}>{record.subtext}</div>}
                </div>
              ) : (
                <span>{record.questionText}</span>
              ),
          },
          {
            title: "Options",
            dataIndex: "options",
            key: "options",
            render: (opts, record) =>
              record.type === "question" && Array.isArray(opts)
                ? opts.map((o, i) => (
                  <div key={i}>
                    {String.fromCharCode(97 + i)}) {o}
                  </div>
                ))
                : null,
          },
          {
            title: "Correct Answer",
            dataIndex: "correctIndex",
            key: "correctIndex",
            render: (index, record) =>
              record.type === "question" && Array.isArray(record.options)
                ? record.options[index]
                : null,
          },
        ]}
        dataSource={examItems.map((item, index) => ({
          key: `${item.type}-${item.id}-${index}`,
          ...item,
          titleOrQuestion: item.type === "section" ? item.title : item.questionText,
        }))}
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
};

