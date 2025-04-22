import React, { useState, useEffect, useMemo } from "react";
import { Button, Typography, Modal, Input, Card, message, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  addSection,
  addQuestion,
  removeQuestion,
  removeSection,
  updateQuestion,
  updateSection
} from "../store/exam/examSlice"; // adjust path if needed
import 'quill/dist/quill.snow.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

const { TextArea } = Input;


const ExamDisplay = () => {
  console.log("ExamDisplay mounted");
  const exam = useSelector((state) => state.exam.examData);
  useEffect(() => {
    console.log("💡 useEffect triggered, examData now:", exam);
  }, [exam]);
  const [examItems, setExamItems] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const dispatch = useDispatch();
  // Move useSensor hooks to top level of the component to ensure consistent hook order
  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  useEffect(() => {
    console.log(" exam:", exam);
    console.log(" examBody:", Array.isArray(exam?.examBody) ? exam.examBody : "Not an array");

    if (!Array.isArray(exam?.examBody)) {
      console.warn(" examBody is not an array or missing:", exam?.examBody);
      return;
    }

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
            section: entry.title,
          });
        });
      } else if (type === "question") {
        items.push(entry);
      } else {
        console.warn(" Unknown item type:", entry);
      }
    });

    console.log(" Parsed examItems:", items);
    setExamItems(items);
    console.log(" Final examItems length:", items.length);
    if (items.length === 0) {
      console.warn(" No items parsed from examBody:", exam.examBody);
    }
  }, [exam]);

  const questionIndexes = useMemo(() => {
    const indexes = {};
    let count = 0;
    examItems.forEach(item => {
      if (item.type === 'question') {
        indexes[item.id] = ++count;
      }
    });
    return indexes;
  }, [examItems]);

  const handleEdit = (item) => {
    if (item.type === 'question') {
      dispatch(updateQuestion({
        location: { questionId: item.id },
        newData: { questionText: "Edited Question" }
      }));
    } else if (item.type === 'section') {
      const index = exam?.examBody?.findIndex(entry => entry.id === item.id);
      if (index !== -1) {
        dispatch(updateSection({
          examBodyIndex: index,
          newData: { title: "Edited Section Title" }
        }));
      }
    }
  };

  const handleDeleteItem = (examBodyIndex, questionsIndex = null) => {
    console.log("Deleting:", { examBodyIndex, questionsIndex });
    if (questionsIndex !== null && questionsIndex !== undefined) {
      dispatch(removeQuestion({ examBodyIndex, questionsIndex }));
    } else {
      const entry = exam?.examBody?.[examBodyIndex];
      if (!entry) return;
      if (entry.type === "section") {
        dispatch(removeSection(examBodyIndex));
      } else {
        dispatch(removeQuestion({ examBodyIndex }));
      }
    }
  };
  
  if (!exam || !Array.isArray(exam.examBody)) {
    return <div>Exam loaded, but examBody is missing or invalid.</div>;
  }


  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3}>{exam.examTitle}</Typography.Title>
        <Typography.Text type="secondary">
          {exam.courseCode} - {exam.courseName} | {exam.semester} {exam.year}
        </Typography.Text>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        dropAnimation={{ duration: 250, easing: 'ease' }}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={({ active }) => setActiveItemId(active.id)}
        onDragEnd={({ active, over }) => {
          setActiveItemId(null);
          if (!over || active.id === over.id) return;

          const updated = arrayMove(
            examItems,
            examItems.findIndex(i => i.id === active.id),
            examItems.findIndex(i => i.id === over.id)
          );
          setExamItems(updated);
          message.success("Reordered");
        }}
      >
        {examItems.length === 0 && (
          <div style={{ marginTop: 24, color: 'red' }}>
            ⚠️ Exam loaded but contains no sections or questions to display.
          </div>
        )}
        <Table
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              key: "id",
            },
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
              render: (text, record) =>
                record.type === "section" ? (
                  <div>
                    <strong>{record.title}</strong>
                    {record.subtext && (
                      <div style={{ fontStyle: "italic", color: "#888" }}>{record.subtext}</div>
                    )}
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
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <>
                  <Button size="small" onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>
                    Edit
                  </Button>
                  <Button size="small" danger onClick={() => handleDeleteItem(record.examBodyIndex, record.questionsIndex)}>
                    Delete
                  </Button>
                </>
              ),
            },
          ]}
          dataSource={(examItems || []).map((item, index) => {
            const examBodyIndex = exam.examBody.findIndex(entry => {
              if (item.type === "section") return entry.id === item.id;
              if (item.type === "question") {
                if (entry.type === "section") {
                  return entry.questions?.some(q => q.id === item.id);
                } else {
                  return entry.id === item.id;
                }
              }
              return false;
            });

            const questionsIndex =
              item.type === "question" && exam.examBody[examBodyIndex]?.type === "section"
                ? exam.examBody[examBodyIndex].questions.findIndex(q => q.id === item.id)
                : undefined;

            console.log("Item Mapping:", {
              id: item.id,
              type: item.type,
              examBodyIndex,
              questionsIndex
            });

            return {
              key: `${item.type}-${item.id}-${index}`,
              ...item,
              titleOrQuestion: item.type === "section" ? item.title : item.questionText,
              examBodyIndex,
              questionsIndex,
            };
          })}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </DndContext>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Button type="dashed" onClick={() => {
          const questionData = {
            questionText: "New Question",
            options: ["Option A", "Option B", "Option C", "Option D", "Option E"],
            correctIndex: 0,
            lockedPositionsMap: [-1, -1, -1, -1, -1],
            answerShuffleMap: [],
          };
          dispatch(addQuestion({ questionData }));
          message.success("Question added");
        }}>Add Question</Button>
        <Button type="dashed" onClick={() => {
          dispatch(addSection({ title: "Untitled Section", subtext: "Instructions..." }));
          message.success("Section added");
        }}>Add Section</Button>
      </div>
    </div>
  );
  
};

export default ExamDisplay;