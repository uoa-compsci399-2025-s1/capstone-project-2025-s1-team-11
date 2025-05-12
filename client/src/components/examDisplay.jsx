import React, { useState, useEffect } from "react";
import { Button, Typography, Modal, Input, message, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  addSection,
  addQuestion,
  removeQuestion,
  removeSection,
  updateQuestion,
  updateSection,
  moveQuestion,
  moveSection,
} from "../store/exam/examSlice";
import { selectExamData } from "../store/exam/selectors";
import 'quill/dist/quill.snow.css';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

const { TextArea } = Input;

const ExamDisplay = () => {
  const exam = useSelector(selectExamData);
  const dispatch = useDispatch();

  // State management for the modal
  const [modalState, setModalState] = useState({
    visible: false,
    type: "", // "section" | "question"
    item: null,
    isDelete: false, // Flag to track delete actions
  });

  const [examItems, setExamItems] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);

  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  useEffect(() => {
    if (exam && Array.isArray(exam.examBody)) {
      const items = [];
      exam.examBody.forEach((entry) => {
        const type = (entry.type || "").toLowerCase();
        if (type === "section") {
          items.push({ id: entry.id, type: "section", title: entry.title, subtext: entry.subtext });
          (entry.questions || []).forEach((q) => {
            items.push({
              ...q,
              type: "question",
              section: entry.sectionTitle,
              questionText: q.questionText || q.contentText,
              options: q.options || (q.answers || []).map(a => a.contentText),
              correctIndex: q.correctIndex ?? (q.answers || []).findIndex(a => a.correct),
            });
          });
        } else if (type === "question") {
          items.push({
            ...entry,
            type: "question",
            questionText: entry.questionText || entry.contentText,
            options: entry.options || (entry.answers || []).map(a => a.contentText),
            correctIndex: entry.correctIndex ?? (entry.answers || []).findIndex(a => a.correct),
          });
        }
      });
      setExamItems(items);
    }
  }, [exam]);

  // Move item handler
  const handleMove = (direction, examBodyIndex, questionsIndex = null) => {
    const newIndex = questionsIndex !== null ? questionsIndex + direction : examBodyIndex + direction;
    if (questionsIndex !== null) {
      dispatch(moveQuestion({
        source: { examBodyIndex, questionsIndex },
        destination: { examBodyIndex, questionsIndex: newIndex },
      }));
    } else {
      const examBody = exam.examBody;
      const currentItem = examBody[examBodyIndex];
      const isSection = currentItem?.type === 'section';
      if (isSection) {
        dispatch(moveSection({ sourceIndex: examBodyIndex, destIndex: newIndex }));
      } else {
        dispatch(moveQuestion({
          source: { examBodyIndex },
          destination: { examBodyIndex: newIndex },
        }));
      }
    }
  };

  // Edit item handler
  const handleEdit = (item) => {
    setModalState({
      visible: true,
      type: item.type,
      item: { ...item },
      isDelete: false,
    });
  };

  // Save edited item
  const handleSaveEdit = () => {
    const { type, item } = modalState;
    let examBodyIndex = -1;
    let questionsIndex;

    if (type === "section") {
      examBodyIndex = exam.examBody.findIndex((entry) => entry.id === item.id);
      dispatch(updateSection({
        examBodyIndex,
        newData: {
          title: item.title,
          subtext: item.subtext,
        },
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
    setModalState({ ...modalState, visible: false });
  };

  // Confirm delete item
  const confirmDeleteItem = (examBodyIndex, questionsIndex = null) => {
    setModalState({
      visible: true,
      type: '',
      item: null,
      isDelete: true,
    });
  };

  // Execute delete item
  const executeDeleteItem = () => {
    const { examBodyIndex, questionsIndex, isDelete } = modalState;
    const entry = exam?.examBody?.[examBodyIndex];

    if (questionsIndex !== null && questionsIndex !== undefined) {
      dispatch(removeQuestion({ examBodyIndex, questionsIndex }));
    } else if (entry.type === "section") {
      dispatch(removeSection(examBodyIndex));
    }

    setModalState({ visible: false, type: '', item: null, isDelete: false });
  };

  if (!exam || !Array.isArray(exam.examBody)) {
    return <div>Please open an exam or create a new file.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3}>{exam.examTitle}</Typography.Title>
        {(exam.courseCode || exam.courseName || exam.semester || exam.year) && (
          <Typography.Text type="secondary">
            {[exam.courseCode, exam.courseName].filter(Boolean).join(" - ")}{" "}
            {exam.semester} {exam.year}
          </Typography.Text>
        )}
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
        {/* Render Table with Data */}
        <Table
          rowClassName="highlighted-table-row"
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              key: "id",
              render: (id) => id?.split('-').pop(),
              width: 70,
            },
            {
              title: "Type",
              dataIndex: "type",
              key: "type",
              width: 100,
            },
            {
              title: "Section",
              dataIndex: "section",
              key: "section",
              width: 120,
              ellipsis: true,
            },
            {
              title: "Title / Question",
              dataIndex: "titleOrQuestion",
              key: "titleOrQuestion",
              width: 300, // Set fixed width for this column
              render: (text, record) => (record.type === "section" ? (
                <div>
                  <strong>{record.title?.split('-').slice(2).join('-').trim()}</strong>
                  {record.subtext && <div style={{ fontStyle: "italic", color: "#888" }}>{record.subtext}</div>}
                </div>
              ) : (
                <Typography.Paragraph
                  style={{ margin: 0, maxWidth: 280 }}
                  ellipsis={{ 
                    rows: 3,
                    expandable: true,
                    symbol: 'more'
                  }}
                >
                  {record.questionText}
                </Typography.Paragraph>
              )),
            },
            {
              title: "Options",
              dataIndex: "options",
              key: "options",
              width: 250,
              // This should fix the options display?
              render: (opts, record) => record.type === "question" && Array.isArray(opts) ? (
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {opts.filter(opt => opt && opt.trim() !== '').map((o, i) => (
                    <Typography.Paragraph 
                      key={i} 
                      ellipsis={{ rows: 2, expandable: true, symbol: '...' }}
                      style={{ margin: '2px 0' }}
                    >
                      {String.fromCharCode(97 + i)}) {o}
                    </Typography.Paragraph>
                  ))}
                </div>
              ) : null,
            },
            {
              title: "Correct Answer",
              dataIndex: "correctIndex",
              key: "correctIndex",
              width: 150,
              render: (index, record) => {
                const validOptions = (record.options || []).filter(opt => opt && opt.trim() !== '');
                return record.type === "question" && validOptions.length > 0 ? (
                  <Typography.Paragraph 
                    ellipsis={{ rows: 2, expandable: true, symbol: '...' }} 
                    style={{ margin: 0 }}
                  >
                    {validOptions[index]}
                  </Typography.Paragraph>
                ) : null;
              },  
            },
            {
              title: "Marks",
              dataIndex: "marks",
              key: "marks",
              width: 80,
              render: (_, record) => record.type === "question" ? record.marks ?? 1 : null,
            },
            {
              title: "Actions",
              key: "actions",
              fixed: 'right',
              width: 140,
              render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button size="small" onClick={() => handleEdit(record)}>
                      Edit
                    </Button>
                    <div>
                      <Button
                        size="small"
                        onClick={() => handleMove(-1, record.examBodyIndex, record.questionsIndex)}
                        disabled={record.questionsIndex === 0 || record.examBodyIndex === 0}
                        style={{ marginRight: 4 }}
                      >
                        ↑
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleMove(1, record.examBodyIndex, record.questionsIndex)}
                        disabled={record.questionsIndex === exam.examBody[record.examBodyIndex]?.questions.length - 1 || record.examBodyIndex === exam.examBody.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="small"
                    danger
                    onClick={() => confirmDeleteItem(record.examBodyIndex, record.questionsIndex)}
                    style={{ width: '100%' }}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          dataSource={examItems}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </DndContext>

      {/* Modal for Edit Section or Question */}
      <Modal
        open={modalState.visible}
        title={`Edit ${modalState.type}`}
        onCancel={() => setModalState({ visible: false })}
        onOk={handleSaveEdit}
      >
        {modalState.type === "section" && (
          <>
            <Input
              value={modalState.item?.title}
              onChange={(e) => setModalState(prev => ({
                ...prev,
                item: { ...prev.item, title: e.target.value }
              }))}
              placeholder="Section Title"
              style={{ marginBottom: 8 }}
            />
            <TextArea
              value={modalState.item?.subtext}
              onChange={(e) => setModalState(prev => ({
                ...prev,
                item: { ...prev.item, subtext: e.target.value }
              }))}
              placeholder="Instructions or Subtext"
              autoSize
            />
          </>
        )}

        {modalState.type === "question" && (
          <>
            <Input
              value={modalState.item?.questionText}
              onChange={(e) => setModalState(prev => ({
                ...prev,
                item: { ...prev.item, questionText: e.target.value }
              }))}
              placeholder="Question Text"
              style={{ marginBottom: 8 }}
            />
            {modalState.item?.options?.filter(opt => opt && opt.trim() !== '').map((opt, index) => (
              <Input
                key={index}
                value={opt}
                onChange={(e) => {
                  const updatedOptions = [...modalState.item.options];
                  updatedOptions[index] = e.target.value;
                  setModalState(prev => ({
                    ...prev,
                    item: { ...prev.item, options: updatedOptions }
                  }));
                }}
                placeholder={`Option ${String.fromCharCode(97 + index)}`}
                style={{ marginBottom: 8 }}
              />
            ))}
          </>
        )}
      </Modal>
    </div>
  );
};

export default ExamDisplay;