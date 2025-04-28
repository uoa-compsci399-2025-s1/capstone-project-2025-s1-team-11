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
  moveSection // added this
} from "../store/exam/examSlice";
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
  const exam = useSelector((state) => state.exam.examData);
  useEffect(() => {
    // Debugging purpose only
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

  const [deleteModalState, setDeleteModalState] = useState({
    visible: false,
    examBodyIndex: null,
    questionsIndex: null,
    isSection: false,
  });

  //  move handler function
  const handleMove = (direction, examBodyIndex, questionsIndex = null) => {
    const newIndex = (questionsIndex !== null && questionsIndex !== undefined)
      ? questionsIndex + direction
      : examBodyIndex + direction;

    if (questionsIndex !== null && questionsIndex !== undefined) {
      // Moving a question inside a section
      dispatch(moveQuestion({
        source: { examBodyIndex, questionsIndex },
        destination: { examBodyIndex, questionsIndex: newIndex },
      }));
    } else {
      const examBody = exam.examBody;
      if (!examBody) return;

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

  useEffect(() => {
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
      
      } else {
        console.warn(" Unknown item type:", entry);
      }
    });

    setExamItems(items);
  }, [exam]);

  const handleEdit = (item) => {
    setEditModal({
      visible: true,
      type: item.type,
      item: { ...item }, // clone for editing
    });
  };

  const handleSaveEdit = () => {
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
  
  const confirmDeleteItem = (examBodyIndex, questionsIndex = null) => {
    const entry = exam?.examBody?.[examBodyIndex];
    if (!entry) {
      console.warn("No entry found at examBodyIndex:", examBodyIndex);
      return;
    }

    const isSection = questionsIndex === null && entry.type === "section";

    setDeleteModalState({
      visible: true,
      examBodyIndex,
      questionsIndex,
      isSection,
    });
  };

  const executeDeleteItem = () => {
    const { examBodyIndex, questionsIndex, isSection } = deleteModalState;
    const entry = exam?.examBody?.[examBodyIndex];

    if (questionsIndex !== null && questionsIndex !== undefined) {
      dispatch(removeQuestion({ examBodyIndex, questionsIndex }));
    } else if (entry.type === "question") {
      dispatch(removeQuestion({ examBodyIndex }));
    } else if (entry.type === "section") {
      dispatch(removeSection(examBodyIndex));
    }

    setDeleteModalState({ visible: false, examBodyIndex: null, questionsIndex: null, isSection: false });
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
              render: (id) => id?.split('-').pop(),
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
                    <strong>{record.title?.split('-').slice(2).join('-').trim()}</strong>
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
                  <Button
                    size="small"
                    onClick={() =>
                      handleMove(-1, record.examBodyIndex, record.questionsIndex)
                    }
                    disabled={record.questionsIndex !== undefined
                      ? record.questionsIndex === 0
                      : record.examBodyIndex === 0}
                    style={{ marginRight: 4 }}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      handleMove(1, record.examBodyIndex, record.questionsIndex)
                    }
                    disabled={
                      record.questionsIndex !== undefined
                        ? record.questionsIndex === exam.examBody[record.examBodyIndex]?.questions.length - 1
                        : record.examBodyIndex === exam.examBody.length - 1
                    }
                    style={{ marginRight: 8 }}
                  >
                    ↓
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() =>
                      record.type === "question"
                        ? confirmDeleteItem(record.examBodyIndex, record.questionsIndex)
                        : confirmDeleteItem(record.examBodyIndex)
                    }
                  >
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
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
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

      <Modal
        open={deleteModalState.visible}
        title={deleteModalState.isSection ? "Delete Section and All Its Questions?" : "Delete Question?"}
        onOk={executeDeleteItem}
        onCancel={() => setDeleteModalState({ visible: false, examBodyIndex: null, questionsIndex: null, isSection: false })}
        okText="Yes, delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          {deleteModalState.isSection
            ? "This will permanently remove the section and all its contained questions. This cannot be undone."
            : "This will permanently remove the question. This cannot be undone."}
        </p>
      </Modal>
    </div>
  );
};

export default ExamDisplay;
