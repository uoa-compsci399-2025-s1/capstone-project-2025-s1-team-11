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
  const [editModal, setEditModal] = useState({
    visible: false,
    type: "", // "section" | "question"
    item: null,
  });

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
    setEditModal({
      visible: true,
      type: item.type,
      item: { ...item }, // clone for editing
    });
// src/components/ExamDisplay.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Space, Table, Typography, Card } from "antd";
//import { addQuestion } from '../actions/examActions';  // Assuming you have an action for adding a question
import { 
  addQuestion,
} from '../store/exam/examSlice';
import {
  selectExamData,
  selectQuestionsForTable,
} from '../store/exam/selectors';

const ExamDisplay = () => {
  // Get exam data from the Redux store
  //const exam = useSelector(state => state.exam);
  const exam = useSelector(selectExamData);
  const dispatch = useDispatch();
  const questions = useSelector(selectQuestionsForTable);

  console.log("Exam in display:", exam);

  const handleAddQuestion = () => {
    const questionData = {
      contentText: 'New Question',
      answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Answer 5'],
      marks: 1,
    };
        
    dispatch(addQuestion({ questionData })); 
  };
    
  const handleSaveEdit = () => {
    console.log("saving edit for:", editModal);
    const { type, item } = editModal;
  
    let examBodyIndex = -1;
    let questionsIndex;
  
    if (type === "section") {
      examBodyIndex = exam.examBody.findIndex((entry) => entry.id === item.id);
      dispatch(updateSection({
        examBodyIndex,
        newData: {
          title: item.title,
          subtext: item.subtext,
        }
      }));
    } else if (type === "question") {
      for (let i = 0; i < exam.examBody.length; i++) {
        const section = exam.examBody[i];
        if (section.type === "section") {
          const qIndex = section.questions?.findIndex((q) => q.id === item.id);
          if (qIndex >= 0) {
            examBodyIndex = i;
            questionsIndex = qIndex;
            break;
          }
        } else if (section.id === item.id) {
          examBodyIndex = i;
          break;
        }
      }
  
      if (examBodyIndex === -1) {
        message.error("Failed to locate the question to update.");
        return;
      }
  
      dispatch(updateQuestion({
        location: {
          examBodyIndex,
          questionsIndex,
          questionId: item.id
        },
        newData: {
          questionText: item.questionText,
          options: item.options,
          correctIndex: item.correctIndex
        }
      }));
    }
  
    message.success("Saved changes");
    setEditModal({ visible: false, type: "", item: null });
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
  
      <Modal
        open={editModal.visible}
        title={`Edit ${editModal.type}`}
        onCancel={() => setEditModal({ visible: false, type: "", item: null })}
        onOk={handleSaveEdit}
      >
        {editModal.type === "section" && (
          <>
            <Input
              value={editModal.item?.title}
              onChange={(e) => setEditModal((prev) => ({
                ...prev,
                item: { ...prev.item, title: e.target.value }
              }))}
              placeholder="Section Title"
              style={{ marginBottom: 8 }}
            />
            <TextArea
              value={editModal.item?.subtext}
              onChange={(e) => setEditModal((prev) => ({
                ...prev,
                item: { ...prev.item, subtext: e.target.value }
              }))}
              placeholder="Instructions or Subtext"
              autoSize
            />
          </>
        )}
  
        {editModal.type === "question" && (
          <>
            <Input
              value={editModal.item?.questionText}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  item: { ...prev.item, questionText: e.target.value },
                }))
              }
              placeholder="Question Text"
              style={{ marginBottom: 8 }}
            />
            {editModal.item?.options?.map((opt, idx) => (
              <Input
                key={idx}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...editModal.item.options];
                  newOpts[idx] = e.target.value;
                  setEditModal((prev) => ({
                    ...prev,
                    item: { ...prev.item, options: newOpts },
                  }));
                }}
                placeholder={`Option ${String.fromCharCode(97 + idx)}`}
                style={{ marginBottom: 6 }}
              />
            ))}
            <Input
              type="number"
              min={0}
              max={editModal.item?.options?.length - 1}
              value={editModal.item?.correctIndex}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  item: { ...prev.item, correctIndex: parseInt(e.target.value, 10) },
                }))
              }
              placeholder="Correct Answer Index"
            />
          </>
        )}
      </Modal>
  const columns = [
    {
      title: 'Section No',
      dataIndex: 'sectionNumber',
      key: 'sectionNumber',
    },
    {
      title: 'Q#',
      dataIndex: 'questionNumber',
      key: 'questionNumber',
    },
    {
      title: 'Question',
      dataIndex: 'questionText',
      key: 'questionText',
    },
    {
      title: 'Marks',
      dataIndex: 'marks',
      key: 'marks',
    },
    {
      title: 'Answers',
      dataIndex: 'answers',
      key: 'answers',
      render: (answers) => answers.map(a => a?.contentText || '').join(', '),
    },
  ];

  return (
    <div>
      <h2>Exam Questions</h2>
      <Button onClick={handleAddQuestion} type="primary" style={{ marginBottom: 16 }}>
        Add Question
      </Button>
      <Table
        dataSource={questions}
        columns={columns}
        rowKey={(record) => `${record.sectionNumber ?? 'none'}-${record.questionNumber}`}
        pagination={false}
      />
    </div>
  );
  
  
};

export default ExamDisplay;

export default ExamDisplay;
