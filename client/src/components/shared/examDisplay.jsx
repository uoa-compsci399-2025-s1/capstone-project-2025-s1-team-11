//examDisplay.jsx

import React, { useState, useMemo, useCallback, Suspense } from "react";
import { Button, Typography, Modal, Input, Table, Dropdown, Menu } from "antd";
const { Title, Text, Paragraph } = Typography;
import { useDispatch, useSelector } from "react-redux";
import {
  removeQuestion,
  removeSection,
  updateQuestion,
  updateSection,
  moveQuestion,
  moveSection,
} from "../../store/exam/examSlice";
import { 
  selectExamData, 
  selectQuestionsAndSectionsForTable
} from "../../store/exam/selectors";
import { htmlToText } from "../../utilities/textUtils";
import CompactRichTextEditor from "../editor/CompactRichTextEditor";
import 'quill/dist/quill.snow.css';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
//import { arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import useMessage from "../../hooks/useMessage.js";

const { TextArea } = Input;

const DEFAULT_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

// Memoized Question Editor Component
const QuestionEditor = React.memo(({ content, onChange }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <CompactRichTextEditor
        key="question-editor"
        content={content}
        onChange={onChange}
        placeholder="Question Text"
      />
    </div>
  );
});

// Memoized Answer Editor Component
const AnswerEditor = React.memo(({ answer, index, onChange }) => {
  const handleChange = useCallback((html) => {
    onChange(html, index);
  }, [onChange, index]);

  return (
    <div style={{ marginBottom: 8 }}>
      <CompactRichTextEditor
        key={`answer-editor-${index}`}
        content={answer.contentFormatted}
        onChange={handleChange}
        placeholder={`Answer ${String(1 + index)}`}
      />
    </div>
  );
});

// Lazy loaded answer editors container
const AnswerEditorsContainer = React.memo(({ answers, onAnswerChange }) => {
  return (
    <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
      {answers.map((answer, index) => (
        <AnswerEditor
          key={`${answer.id || index}`}
          answer={answer}
          index={index}
          onChange={onAnswerChange}
        />
      ))}
    </div>
  );
});

// New component for the modal editor
const ExamItemEditor = React.memo(({ modalState, onSave }) => {
  const [itemState, setItemState] = useState(modalState.item);

  const handleQuestionContentChange = useCallback((html) => {
    setItemState(prev => ({
      ...prev,
      contentFormatted: html
    }));
  }, []);

  const handleAnswerContentChange = useCallback((html, index) => {
    setItemState(prev => {
      const updatedAnswers = [...prev.answers];
      updatedAnswers[index] = {
        ...updatedAnswers[index],
        contentFormatted: html
      };
      return {
        ...prev,
        answers: updatedAnswers
      };
    });
  }, []);

  const handleSectionTitleChange = useCallback((e) => {
    setItemState(prev => ({
      ...prev,
      sectionTitle: e.target.value
    }));
  }, []);

  // Pass the current state up to parent when modal confirms
  React.useEffect(() => {
    // Update the parent's reference to the current state
    onSave(itemState);
  }, [itemState, onSave]);

  if (modalState.type === "section") {
    return (
      <>
        <Input
          value={itemState?.sectionTitle}
          onChange={handleSectionTitleChange}
          placeholder="Section Title"
          style={{ marginBottom: 8 }}
        />
        <div style={{ marginBottom: 16 }}>
          <CompactRichTextEditor
            key="section-editor"
            content={itemState?.contentFormatted}
            onChange={handleQuestionContentChange}
            placeholder="Instructions or Subtext"
          />
        </div>
      </>
    );
  }

  if (modalState.type === "question") {
    return (
      <>
        <QuestionEditor
          content={itemState?.contentFormatted}
          onChange={handleQuestionContentChange}
        />
        <Suspense fallback={<div>Loading answer editors...</div>}>
          <AnswerEditorsContainer
            answers={itemState?.answers || []}
            onAnswerChange={handleAnswerContentChange}
          />
        </Suspense>
      </>
    );
  }

  return null;
});

const ExamDisplay = () => {
  const exam = useSelector(selectExamData);
  const tableData = useSelector(selectQuestionsAndSectionsForTable);
  const dispatch = useDispatch();
  const message = useMessage();

  const [modalState, setModalState] = useState({
    visible: false,
    type: "", 
    item: null,
    examBodyIndex: null,
    questionsIndex: null,
    isDelete: false,
  });

  // Track the current editor state
  const [currentEditorState, setCurrentEditorState] = useState(null);

  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const handleMove = useCallback((direction, examBodyIndex, questionsIndex = null) => {
    if (examBodyIndex === undefined || !exam?.examBody) {
      message.error("Cannot move item: invalid exam data");
      return;
    }

    // Validate examBodyIndex is within bounds
    if (examBodyIndex < 0 || examBodyIndex >= exam.examBody.length) {
      message.error("Cannot move item: invalid position");
      return;
    }

    try {
      // For questions within a section - move within that section only
      if (questionsIndex !== null && questionsIndex !== undefined) {
        const section = exam.examBody[examBodyIndex];
        
        if (!section || section.type !== 'section' || !Array.isArray(section.questions)) {
          message.error("Cannot move question: section not found or invalid");
          return;
        }
        
        const newIndex = questionsIndex + direction;
        
        // Check bounds for questions within section
        if (newIndex < 0 || newIndex >= section.questions.length) {
          message.warning(`Cannot move question ${direction > 0 ? 'down' : 'up'}: already at ${direction > 0 ? 'bottom' : 'top'} of section`);
          return;
        }
        
        dispatch(moveQuestion({
          source: { examBodyIndex, questionsIndex },
          destination: { examBodyIndex, questionsIndex: newIndex },
        }));
        message.success("Question moved within section");
      } 
      // For sections or standalone questions at exam body level
      else {
        const newIndex = examBodyIndex + direction;
        
        // Check bounds for exam body items
        if (newIndex < 0 || newIndex >= exam.examBody.length) {
          message.warning(`Cannot move ${direction > 0 ? 'down' : 'up'}: already at ${direction > 0 ? 'bottom' : 'top'} of exam`);
          return;
        }
        
        const currentItem = exam.examBody[examBodyIndex];
        if (!currentItem) {
          message.error("Cannot move item: item not found");
          return;
        }
        
        const isSection = currentItem?.type?.toLowerCase() === 'section';
        
        if (isSection) {
          dispatch(moveSection({ sourceIndex: examBodyIndex, destIndex: newIndex }));
          message.success("Section moved");
        } else {
          dispatch(moveQuestion({
            source: { examBodyIndex },
            destination: { examBodyIndex: newIndex },
          }));
          message.success("Question moved");
        }
      }
    } catch (error) {
      console.error("Error moving item:", error);
      message.error("Failed to move item. Please try again.");
    }
  }, [dispatch, exam, message]);

  // Handle moving question out of section (make it standalone)
  const handleMoveOutOfSection = useCallback((examBodyIndex, questionsIndex) => {
    if (!exam?.examBody || examBodyIndex === undefined || questionsIndex === undefined) {
      message.error("Cannot move question out of section: invalid data");
      return;
    }

    try {
      // Move question from section to exam body level (at the end)
      dispatch(moveQuestion({
        source: { examBodyIndex, questionsIndex },
        destination: { examBodyIndex: exam.examBody.length }, // Move to end of exam body
      }));
      message.success("Question moved out of section");
    } catch (error) {
      console.error("Error moving question out of section:", error);
      message.error("Failed to move question out of section");
    }
  }, [dispatch, exam, message]);

  // Handle moving standalone question into a section
  const handleMoveIntoSection = useCallback((questionExamBodyIndex, targetSectionIndex) => {
    if (!exam?.examBody || questionExamBodyIndex === undefined || targetSectionIndex === undefined) {
      message.error("Cannot move question into section: invalid data");
      return;
    }

    const targetSection = exam.examBody[targetSectionIndex];
    if (!targetSection || targetSection.type !== 'section') {
      message.error("Target is not a valid section");
      return;
    }

    try {
      // Move question into section (at the end of section's questions)
      const questionsLength = targetSection.questions?.length || 0;
      dispatch(moveQuestion({
        source: { examBodyIndex: questionExamBodyIndex },
        destination: { examBodyIndex: targetSectionIndex, questionsIndex: questionsLength },
      }));
      message.success("Question moved into section");
    } catch (error) {
      console.error("Error moving question into section:", error);
      message.error("Failed to move question into section");
    }
  }, [dispatch, exam, message]);

  // Helper function to check if item can move up within its container
  const canMoveUp = useCallback((record) => {
    if (!exam?.examBody || !record || record.examBodyIndex === undefined) {
      return false;
    }
    
    // For questions within a section
    if (record.questionsIndex !== undefined) {
      return record.questionsIndex > 0;
    }
    
    // For sections or standalone questions
    return record.examBodyIndex > 0;
  }, [exam]);

  // Helper function to check if item can move down within its container
  const canMoveDown = useCallback((record) => {
    if (!exam?.examBody || !record || record.examBodyIndex === undefined) {
      return false;
    }
    
    // For questions within a section
    if (record.questionsIndex !== undefined) {
      const section = exam.examBody[record.examBodyIndex];
      if (!section || section.type !== 'section' || !Array.isArray(section.questions)) {
        return false;
      }
      return record.questionsIndex < section.questions.length - 1;
    }
    
    // For sections or standalone questions
    return record.examBodyIndex < exam.examBody.length - 1;
  }, [exam]);

  // Helper to get available sections for moving questions into
  const getAvailableSections = useCallback(() => {
    if (!exam?.examBody) return [];
    
    return exam.examBody
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type === 'section')
      .map(({ item, index }) => ({
        value: index,
        label: item.sectionTitle || `Section ${item.sectionNumber || index + 1}`
      }));
  }, [exam]);

  // Reset modal state helper
  const resetModalState = useCallback(() => {
    setModalState({
      visible: false,
      type: "", 
      item: null,
      examBodyIndex: null,
      questionsIndex: null,
      isDelete: false,
    });
  }, []);

  // Edit item handler
  const handleEdit = useCallback((item) => {
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
      message.error('Failed to find item to edit');
      return;
    }

    setModalState({
      visible: true,
      type: item.type,
      item: actualItem,
      examBodyIndex: item.examBodyIndex,
      questionsIndex: item.questionsIndex,
      isDelete: false,
    });
  }, [exam, message]);

  // Save edited item
  const handleSaveEdit = useCallback(() => {
    const { type, examBodyIndex, questionsIndex } = modalState;
    
    // Use the currentEditorState which has been kept in sync with the editor
    if (!currentEditorState) return;

    if (type === "section") {
      dispatch(updateSection({
        examBodyIndex,
        newData: {
          sectionTitle: currentEditorState.sectionTitle,
          contentFormatted: currentEditorState.contentFormatted
        }
      }));
    } else if (type === "question") {
      dispatch(updateQuestion({
        location: {
          examBodyIndex,
          questionsIndex,
          questionId: currentEditorState.id
        },
        newData: {
          contentFormatted: currentEditorState.contentFormatted,
          answers: currentEditorState.answers
        }
      }));
    }

    message.success("Saved changes");
    resetModalState();
  }, [currentEditorState, dispatch, modalState, resetModalState, message]);

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

  // Memoize the columns configuration with exam as a dependency
  const columns = useMemo(() => [
    {
      title: "Actions",
      key: "actions-column",
      fixed: 'left',
      width: 160,
      render: (_, record) => {
        if (!exam?.examBody || !Array.isArray(exam.examBody) || exam.examBody.length === 0) {
          return null;
        }

        const availableSections = getAvailableSections();
        const isQuestion = record.type === 'question';
        const isInSection = record.questionsIndex !== undefined;
        const isStandaloneQuestion = isQuestion && !isInSection;

        // Create cross-boundary movement menu
        const crossBoundaryMenuItems = [];

        if (isInSection) {
          // Question is in a section - can move out
          crossBoundaryMenuItems.push({
            key: 'move-out',
            label: 'Move Out of Section',
            onClick: () => handleMoveOutOfSection(record.examBodyIndex, record.questionsIndex)
          });
        }

        if (isStandaloneQuestion && availableSections.length > 0) {
          // Standalone question - can move into sections
          crossBoundaryMenuItems.push({
            key: 'move-into-header',
            label: 'Move Into Section:',
            disabled: true,
            style: { fontWeight: 'bold' }
          });
          
          availableSections.forEach(section => {
            crossBoundaryMenuItems.push({
              key: `move-into-${section.value}`,
              label: `→ ${section.label}`,
              onClick: () => handleMoveIntoSection(record.examBodyIndex, section.value)
            });
          });
        }

        const crossBoundaryMenu = crossBoundaryMenuItems.length > 0 ? (
          <Menu items={crossBoundaryMenuItems} />
        ) : null;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* First row: Edit and Up/Down */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button size="small" onClick={() => handleEdit(record)}>
                Edit
              </Button>
              <div>
                <Button
                  size="small"
                  onClick={() => handleMove(-1, record.examBodyIndex, record.questionsIndex !== undefined ? record.questionsIndex : null)}
                  disabled={!canMoveUp(record)}
                  style={{ marginRight: 4 }}
                  title={canMoveUp(record) ? "Move up within container" : "Cannot move up"}
                >
                  ↑
                </Button>
                <Button
                  size="small"
                  onClick={() => handleMove(1, record.examBodyIndex, record.questionsIndex !== undefined ? record.questionsIndex : null)}
                  disabled={!canMoveDown(record)}
                  title={canMoveDown(record) ? "Move down within container" : "Cannot move down"}
                >
                  ↓
                </Button>
              </div>
            </div>

            {/* Second row: Cross-boundary movement and Delete */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {crossBoundaryMenu ? (
                <Dropdown overlay={crossBoundaryMenu} trigger={['click']} placement="bottomLeft">
                  <Button size="small">
                    Move 
                  </Button>
                </Dropdown>
              ) : (
                <div style={{ width: '60px' }}></div> // Spacer
              )}
              
              <Button
                size="small"
                danger
                onClick={() => confirmDeleteItem(record.examBodyIndex, record.questionsIndex !== undefined ? record.questionsIndex : null)}
              >
                Delete
              </Button>
            </div>
          </div>
        );
      },
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
          return record.sectionNumber || record.sectionTitle;
        }
        return record.sectionNumber;
      },
    },
    {
      title: "Question / Content",
      key: "content-column",
      width: 300,
      render: (_, record) => {
        if (!record?.contentFormatted) return null;
        
        if (record.type === "section") {
          return (
            <div key={`section-content-${record.id}`}>
              <Paragraph
                style={{ margin: 0, maxWidth: 280 }}
                ellipsis={{ 
                  rows: 3,
                  expandable: true,
                  symbol: 'more'
                }}
              >
                {htmlToText(record.contentFormatted)}
              </Paragraph>
            </div>
          );
        }
        return (
          <Paragraph
            key={`question-content-${record.id}`}
            style={{ margin: 0, maxWidth: 280 }}
            ellipsis={{ 
              rows: 3,
              expandable: true,
              symbol: 'more'
            }}
          >
            {htmlToText(record.contentFormatted)}
          </Paragraph>
        );
      },
    },
    {
      title: "Answers",
      key: "answers-column",
      width: 250,
      render: (_, record) => {
        if (record.type !== "question" || !Array.isArray(record.answers)) return null;
        
        const options = exam?.teleformOptions || DEFAULT_OPTIONS;
        
        return (
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {record.answers.map((answer, i) => (
              <Paragraph 
                key={`${record.id}-answer-${i}`} 
                ellipsis={{ rows: 2, expandable: true, symbol: '...' }}
                style={{ 
                  margin: '2px 0',
                  color: answer.correct ? '#52c41a' : 'inherit'
                }}
              >
                {options[i]}) {htmlToText(answer.contentFormatted)}
              </Paragraph>
            ))}
          </div>
        );
      },
    },
    {
      title: "Marks",
      dataIndex: "marks",
      key: "marks-column",
      width: 80,
      render: (marks, record) => record.type === "question" ? marks : null,
    },
  ], [exam, handleEdit, handleMove, canMoveUp, canMoveDown, getAvailableSections, handleMoveOutOfSection, handleMoveIntoSection]);

  // Memoize the table data
  const memoizedTableData = useMemo(() => tableData || [], [tableData]);

  if (!exam || !Array.isArray(exam.examBody)) {
    return <div>Please open an exam or create a new file.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
       <Title level={3}>{exam.examTitle}</Title>
        {(exam.courseCode || exam.courseName || exam.semester || exam.year) && (
          <Text type="secondary">
            {[exam.courseCode, exam.courseName].filter(Boolean).join(" - ")}{" "}
            {exam.semester} {exam.year}
          </Text>
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
          columns={columns}
          dataSource={memoizedTableData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </DndContext>

      {/* Modal with extracted editor component */}
      <Modal
        open={modalState.visible}
        title={modalState.isDelete ? 'Confirm Delete' : `Edit ${modalState.type}`}
        onCancel={resetModalState}
        onOk={modalState.isDelete ? executeDeleteItem : handleSaveEdit}
        width={800}
        destroyOnHidden={true}
      >
        {modalState.isDelete ? (
          <Paragraph>Are you sure you want to delete this item?</Paragraph>
        ) : (
          <ExamItemEditor
            modalState={modalState}
            onSave={setCurrentEditorState}
            onCancel={resetModalState}
          />
        )}
      </Modal>
    </div>
  );
};

export default ExamDisplay;