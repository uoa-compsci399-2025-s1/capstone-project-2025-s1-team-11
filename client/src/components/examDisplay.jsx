//examDisplay.jsx

import React, { useState } from "react";
import { Button, Typography, Modal, Input, message, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  removeQuestion,
  removeSection,
  updateQuestion,
  updateSection,
  moveQuestion,
  moveSection,
} from "../store/exam/examSlice";
import { 
  selectExamData, 
  selectQuestionsAndSectionsForTable,
  selectExamMetadata,
  selectQuestionByPath,
  selectSectionByIndex
} from "../store/exam/selectors";
import { htmlToText } from "../utilities/textUtils";
import CompactRichTextEditor from "./editor/CompactRichTextEditor";
import 'quill/dist/quill.snow.css';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

const { TextArea } = Input;

const ExamDisplay = () => {
  const exam = useSelector(selectExamData);
  const examMetadata = useSelector(selectExamMetadata);
  const tableData = useSelector(selectQuestionsAndSectionsForTable);
  const dispatch = useDispatch();

  const [modalState, setModalState] = useState({
    visible: false,
    type: "", 
    item: null,
    examBodyIndex: null,
    questionsIndex: null,
    isDelete: false, 
  });

  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

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

  // Reset modal state helper
  const resetModalState = () => {
    setModalState({
      visible: false,
      type: "", 
      item: null,
      examBodyIndex: null,
      questionsIndex: null,
      isDelete: false,
    });
  };

  // Edit item handler
  const handleEdit = (item) => {
    console.log('Edit clicked for item:', {
      id: item.id,
      type: item.type,
      examBodyIndex: item.examBodyIndex,
      questionsIndex: item.questionsIndex
    });

    // Get the actual item from the exam data
    let actualItem;
    if (item.type === 'section') {
      actualItem = exam.examBody[item.examBodyIndex];
    } else if (item.type === 'question') {
      const section = exam.examBody[item.examBodyIndex];
      if (section?.type === 'section') {
        actualItem = section.questions[item.questionsIndex];
      } else {
        actualItem = section;
      }
    }

    if (!actualItem) {
      console.error('Failed to find item to edit:', item);
      message.error('Failed to find item to edit');
      return;
    }

    console.log('Actual item being edited:', actualItem);

    setModalState({
      visible: true,
      type: item.type,
      item: actualItem,
      examBodyIndex: item.examBodyIndex,
      questionsIndex: item.questionsIndex,
      isDelete: false,
    });
  };

  // Save edited item
  const handleSaveEdit = () => {
    const { type, item, examBodyIndex, questionsIndex } = modalState;

    if (type === "section") {
      dispatch(updateSection({
        examBodyIndex,
        newData: {
          sectionTitle: item.sectionTitle,
          contentFormatted: item.contentFormatted
        }
      }));
    } else if (type === "question") {
      dispatch(updateQuestion({
        location: {
          examBodyIndex,
          questionsIndex,
          questionId: item.id
        },
        newData: {
          contentFormatted: item.contentFormatted
        }
      }));
    }

    message.success("Saved changes");
    resetModalState();
  };

  // Confirm delete item
  const confirmDeleteItem = (examBodyIndex, questionsIndex = null) => {
    setModalState({
      visible: true,
      type: '',
      item: null,
      isDelete: true,
      examBodyIndex,
      questionsIndex
    });
  };

  // Execute delete item
  const executeDeleteItem = () => {
    const { examBodyIndex, questionsIndex, isDelete } = modalState;
    
    if (!isDelete || examBodyIndex === undefined) {
      setModalState({ visible: false, type: '', item: null, isDelete: false });
      return;
    }
    
    const entry = exam?.examBody?.[examBodyIndex];

    if (questionsIndex !== null && questionsIndex !== undefined) {
      dispatch(removeQuestion({ examBodyIndex, questionsIndex }));
    } else if (entry?.type === "section") {
      dispatch(removeSection(examBodyIndex));
    }

    setModalState({ visible: false, type: '', item: null, isDelete: false });
  };

  if (!exam || !Array.isArray(exam.examBody)) {
    return <div>Please open an exam or create a new file.</div>;
  }

  // Debug table data
  console.log('Table data:', tableData.map(item => ({
    id: item.id,
    type: item.type,
    examBodyIndex: item.examBodyIndex,
    questionsIndex: item.questionsIndex,
    contentPreview: (item.contentFormatted || item.contentText || '').substring(0, 50)
  })));

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
          
          const activeItem = tableData.find(i => i.id === active.id);
          const overItem = tableData.find(i => i.id === over.id);
          
          if (!activeItem || !overItem) return;
          
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
          rowKey="id" 
          rowClassName={(record) => `highlighted-table-row ${record.type === 'section' ? 'section-row' : 'question-row'}`}
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
            },
            {
              title: "Type",
              dataIndex: "type",
              key: "type-column",
              width: 100,
              render: (type) => type === 'section' ? 'Section' : 'Question'
            },
            {
              title: "Section ID",
              key: "section-column",
              width: 120,
              ellipsis: true,
              render: (_, record) => {
                if (record.type === "section") {
                  return <strong>{record.sectionTitle || record.sectionNumber}</strong> //`Section ${record.sectionNumber}`}</strong>;
                }
                return record.sectionNumber //? `Section ${record.sectionNumber}` : null;
              },
            },
            {
              title: "Question / Content",
              key: "content-column",
              width: 300,
              render: (_, record) => {
                if (record.type === "section") {
                  return (
                    <div key={`section-content-${record.id}`}>
                      <Typography.Paragraph
                        style={{ margin: 0, maxWidth: 280 }}
                        ellipsis={{ 
                          rows: 3,
                          expandable: true,
                          symbol: 'more'
                        }}
                      >
                        {htmlToText(record.contentFormatted)}
                      </Typography.Paragraph>
                    </div>
                  );
                }
                return (
                  <Typography.Paragraph
                    key={`question-content-${record.id}`}
                    style={{ margin: 0, maxWidth: 280 }}
                    ellipsis={{ 
                      rows: 3,
                      expandable: true,
                      symbol: 'more'
                    }}
                  >
                    {htmlToText(record.contentFormatted)}
                  </Typography.Paragraph>
                );
              },
            },
            {
              title: "Answers",
              key: "answers-column",
              width: 250,
              render: (_, record) => record.type === "question" && Array.isArray(record.answers) && record.answers.length > 0 ? (
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {record.answers.map((answer, i) => (
                    <Typography.Paragraph 
                      key={`${record.id}-answer-${i}`} 
                      ellipsis={{ rows: 2, expandable: true, symbol: '...' }}
                      style={{ 
                        margin: '2px 0',
                        color: answer.correct ? '#52c41a' : 'inherit'
                      }}
                    >
                      {String(1 + i)}) {htmlToText(answer.contentFormatted)}
                    </Typography.Paragraph>
                  ))}
                </div>
              ) : null,
            },
            {
              title: "Marks",
              dataIndex: "marks",
              key: "marks-column",
              width: 80,
              render: (marks, record) => record.type === "question" ? marks : null,
            },
          ]}
          dataSource={tableData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </DndContext>

      {/* Modal for Edit Section or Question */}
      <Modal
        open={modalState.visible}
        title={modalState.isDelete ? 'Confirm Delete' : `Edit ${modalState.type}`}
        onCancel={resetModalState}
        onOk={modalState.isDelete ? executeDeleteItem : handleSaveEdit}
        width={800}
        destroyOnClose={true}
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
            <div style={{ marginBottom: 16 }}>
              <CompactRichTextEditor
                content={modalState.item?.contentFormatted}
                onChange={(html) => setModalState(prev => ({
                  ...prev,
                  item: { ...prev.item, contentFormatted: html }
                }))}
                placeholder="Instructions or Subtext"
              />
            </div>
          </>
        ) : modalState.type === "question" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <CompactRichTextEditor
                content={modalState.item?.contentFormatted}
                onChange={(html) => setModalState(prev => ({
                  ...prev,
                  item: { ...prev.item, contentFormatted: html }
                }))}
                placeholder="Question Text"
              />
            </div>
            {modalState.item?.answers?.map((answer, index) => (
              <div key={`modal-answer-${index}`} style={{ marginBottom: 8 }}>
                <CompactRichTextEditor
                  content={answer.contentFormatted}
                  onChange={(html) => {
                    const updatedAnswers = [...modalState.item.answers];
                    updatedAnswers[index] = {
                      ...updatedAnswers[index],
                      contentFormatted: html
                    };
                    setModalState(prev => ({
                      ...prev,
                      item: { ...prev.item, answers: updatedAnswers }
                    }));
                  }}
                  placeholder={`Answer ${String(1 + index)}`}
                />
              </div>
            ))}
          </>
        )}
      </Modal>
    </div>
  );
};

export default ExamDisplay;