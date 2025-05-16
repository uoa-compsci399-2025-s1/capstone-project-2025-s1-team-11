import React, { useState, useEffect } from "react";
import { Button, Typography, Modal, Input, App, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
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
import { htmlToText } from '../utils/textUtils';

const { TextArea } = Input;

export const ExamDisplay = () => {
  const exam = useSelector(selectExamData);
  const dispatch = useDispatch();
  const { message } = App.useApp();

  const [modalState, setModalState] = useState({
    visible: false,
    type: "", 
    item: null,
    isDelete: false, 
  });

  const [examItems, setExamItems] = useState([]);

  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  useEffect(() => {
    if (!exam) {
      setExamItems([]);
      return;
    }

    if (!Array.isArray(exam?.examBody)) {
      console.warn("examBody is not an array or missing:", exam?.examBody);
      return;
    }

    const items = [];
    exam.examBody.forEach((entry, examBodyIndex) => {
      const type = (entry.type || "").toLowerCase();
      
      if (type === "section") {
        const sectionKey = entry.id ? `section-${entry.id}` : `section-index-${examBodyIndex}`;
        const section = { 
          id: entry.id, 
          type: "section", 
          sectionTitle: entry.sectionTitle,
          contentFormatted: entry.contentFormatted,
          contentText: entry.contentText,
          subtext: entry.subtext,
          examBodyIndex,
          sectionNumber: examBodyIndex + 1,
          key: sectionKey 
        };
        items.push(section);

        (entry.questions || []).forEach((question, questionsIndex) => {
          const questionKey = question.id ? 
            `question-${question.id}-${examBodyIndex}-${questionsIndex}` : 
            `question-index-${examBodyIndex}-${questionsIndex}`;
          
          items.push({
            ...question,
            type: "question",
            section: entry.sectionTitle,
            contentText: question.contentText,
            options: question.options || (question.answers || []).map(a => a.contentText),
            correctIndex: question.correctIndex ?? (question.answers || []).findIndex(a => a.correct),
            examBodyIndex,
            questionsIndex,
            questionNumber: question.questionNumber,
            key: questionKey
          });
        });
      } else if (type === "question") {
        const questionKey = entry.id ? 
          `question-${entry.id}-${examBodyIndex}` : 
          `question-index-${examBodyIndex}`;
          
        items.push({
          ...entry,
          type: "question",
          contentText: entry.contentText,
          options: entry.options || (entry.answers || []).map(a => a.contentText),
          correctIndex: entry.correctIndex ?? (entry.answers || []).findIndex(a => a.correct),
          examBodyIndex,
          questionNumber: examBodyIndex + 1,
          key: questionKey
        });
      }
    });

    setExamItems(items);
  }, [exam]);

  const handleMove = (direction, examBodyIndex, questionsIndex = null) => {
    if (examBodyIndex === undefined) return;

    if (questionsIndex !== null && questionsIndex !== undefined) {
      const newIndex = questionsIndex + direction;
      
      const section = exam.examBody[examBodyIndex];
      if (newIndex < 0 || newIndex >= (section?.questions?.length || 0)) return;
      
      dispatch(moveQuestion({
        source: { examBodyIndex, questionsIndex },
        destination: { examBodyIndex, questionsIndex: newIndex },
      }));
    } 
    else {
      const newIndex = examBodyIndex + direction;
      
      if (newIndex < 0 || newIndex >= exam.examBody.length) return;
      
      const examBody = exam.examBody;
      const currentItem = examBody[examBodyIndex];
      const isSection = currentItem?.type?.toLowerCase() === 'section';
      
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
          sectionTitle: item.sectionTitle,
          contentText: item.contentText,
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
          contentText: item.contentText,
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
    console.log('Confirming delete:', { examBodyIndex, questionsIndex });
    setModalState({
      visible: true,
      type: '',
      item: null,
      isDelete: true,
      examBodyIndex,
      questionsIndex: questionsIndex !== undefined ? questionsIndex : null
    });
  };

  // Execute delete item
  const executeDeleteItem = () => {
    const { examBodyIndex, questionsIndex, isDelete } = modalState;
    console.log('Delete modal state:', { examBodyIndex, questionsIndex, isDelete });
    
    if (!isDelete || examBodyIndex === undefined) {
      setModalState({ visible: false, type: '', item: null, isDelete: false });
      return;
    }
    
    const entry = exam?.examBody?.[examBodyIndex];
    console.log('Entry type:', entry?.type, 'questionsIndex:', questionsIndex);

    // If it's a section and we're not trying to delete a question within it
    if (entry?.type === "section" && questionsIndex === null) {
      dispatch(removeSection(examBodyIndex));
    } else if (entry?.type === "section") {
      // If it's a question within a section
      dispatch(removeQuestion({ examBodyIndex, questionsIndex }));
    } else {
      // If it's a standalone question
      dispatch(removeQuestion({ examBodyIndex }));
    }

    setModalState({ visible: false, type: '', item: null, isDelete: false });
    message.success("Item deleted successfully");
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
        onDragStart={() => {}}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const activeItem = examItems.find(i => i.id === active.id);
          const overItem = examItems.find(i => i.id === over.id);
          if (!activeItem || !overItem) return;
          const updated = arrayMove(
            examItems,
            examItems.findIndex(i => i.id === active.id),
            examItems.findIndex(i => i.id === over.id)
          );
          setExamItems(updated);
          if (activeItem.type === "section") {
            dispatch(moveSection({
              sourceIndex: activeItem.examBodyIndex,
              destIndex: overItem.examBodyIndex
            }));
          } else {
            dispatch(moveQuestion({
              source: { 
                examBodyIndex: activeItem.examBodyIndex,
                questionsIndex: activeItem.questionsIndex
              },
              destination: { 
                examBodyIndex: overItem.examBodyIndex,
                questionsIndex: overItem.questionsIndex
              }
            }));
          }
          
          message.success("Reordered");
        }}
      >
        <Table
          columns={[
            {
              title: "Actions",
              key: "actions-column",
              fixed: 'left',
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
                        onClick={() => handleMove(-1, record.examBodyIndex, record.questionsIndex !== undefined ? record.questionsIndex : null)}
                        disabled={
                          (record.questionsIndex !== undefined && record.questionsIndex === 0) || 
                          (record.questionsIndex === undefined && record.examBodyIndex === 0)
                        }
                        style={{ marginRight: 4 }}
                      >
                        ↑
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleMove(1, record.examBodyIndex, record.questionsIndex !== undefined ? record.questionsIndex : null)}
                        disabled={
                          !exam.examBody?.[record.examBodyIndex] ||
                          (record.questionsIndex !== undefined && 
                           record.questionsIndex === (exam.examBody[record.examBodyIndex]?.questions?.length - 1)) || 
                          (record.questionsIndex === undefined && record.examBodyIndex === (exam.examBody.length - 1))
                        }
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="small"
                    danger
                    onClick={() => confirmDeleteItem(record.examBodyIndex, record.questionsIndex !== undefined ? record.questionsIndex : null)}
                    style={{ width: '100%' }}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
            {
              title: "Question #",
              dataIndex: "questionNumber",
              key: "question-number-column",
              width: 100,
              render: (text, record) => record.type === "question" ? record.questionNumber : null,
            },
            {
              title: "Type",
              dataIndex: "type",
              key: "type-column",
              width: 100,
            },
            {
              title: "Section",
              dataIndex: "section",
              key: "section-column",
              width: 120,
              ellipsis: true,
              render: (text, record) => {
                if (record.type === "section") {
                  return record.sectionNumber ? `Section ${record.sectionNumber}` : record.sectionTitle;
                }
                return record.section;
              },
            },
            {
              title: "Question / Content",
              dataIndex: "questionContent",
              key: "question-content-column",
              width: 300, 
              render: (text, record) => (record.type === "section" ? (
                <div>
                  {(record.contentText) && (
                    <Typography.Paragraph
                      style={{ margin: 0, maxWidth: 280 }}
                      ellipsis={{ 
                        rows: 3,
                        expandable: true,
                        symbol: 'more'
                      }}
                    >
                      {record.contentText || record.contentFormatted}
                    </Typography.Paragraph>
                  )}
                  {record.sectionTitle && <strong>{record.sectionTitle}</strong>}
                  {record.subtext && <div style={{ fontStyle: "italic" }}>{record.subtext}</div>}
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
                  {record.contentText}
                </Typography.Paragraph>
              )),
            },
            {
              title: "Options",
              dataIndex: "options",
              key: "options-column",
              width: 250,
              render: (opts, record) => record.type === "question" && Array.isArray(opts) ? (
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {opts.filter(opt => opt && opt.trim() !== '').map((o, i) => (
                    <Typography.Paragraph 
                      key={`${record.key}-option-${i}`} 
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
              key: "correct-answer-column",
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
              key: "marks-column",
              width: 80,
              render: (_, record) => record.type === "question" ? record.marks ?? 1 : null,
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
        title={modalState.isDelete ? 'Confirm Delete' : `Edit ${modalState.type}`}
        onCancel={() => setModalState({ visible: false })}
        onOk={modalState.isDelete ? executeDeleteItem : handleSaveEdit}
      >
        {modalState.isDelete ? (
          <p>Are you sure you want to delete this item?</p>
        ) : modalState.type === "section" ? (
          <>
            <Input
              value={modalState.item?.sectionTitle}
              onChange={(e) => setModalState(prev => ({
                ...prev,
                item: { ...prev.item, sectionTitle: e.target.value }
              }))}
              placeholder="Section Title"
              style={{ marginBottom: 8 }}
            />
            <TextArea
              value={modalState.item?.contentText}
              onChange={(e) => setModalState(prev => ({
                ...prev,
                item: { ...prev.item, contentText: e.target.value }
              }))}
              placeholder="Instructions or Subtext"
              autoSize
            />
          </>
        ) : modalState.type === "question" && (
          <>
            <Input
              value={modalState.item?.contentText}
              onChange={(e) => setModalState(prev => ({
                ...prev,
                item: { ...prev.item, contentText: e.target.value }
              }))}
              placeholder="Question Text"
              style={{ marginBottom: 8 }}
            />
            {modalState.item?.options?.filter(opt => opt && opt.trim() !== '').map((opt, index) => (
              <Input
                key={`modal-option-${index}`}
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