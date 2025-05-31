//examDisplay.jsx

import React, { useState, useMemo, useCallback } from "react";
import { Button, Typography, Modal, Input, Table, Tabs } from "antd";
import ExamPreview from "../exam/ExamPreview";
const { Title, Text, Paragraph } = Typography;
import { useDispatch, useSelector } from "react-redux";
import {
  removeQuestion,
  removeSection,
  updateQuestion,
  updateSection,
  moveQuestion,
  moveSection,
} from "../../store/exam/examSlice.js";
import { 
  selectExamData, 
  selectQuestionsAndSectionsForTable
} from "../../store/exam/selectors.js";
import { htmlToText } from "../../utilities/textUtils";
import 'quill/dist/quill.snow.css';
import RichTextEditor from "../editor/RichTextEditor.jsx";
import { QuestionEditorContainer } from "./QuestionEditor.jsx";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
//import { arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import useMessage from "../../hooks/useMessage.js";
import SummaryTable from "../SummaryTable";
import { DEFAULT_OPTIONS } from '../../constants/answerOptions';

const { TextArea } = Input;

// New component for the modal editor
const ExamItemEditor = React.memo(({ modalState, onSave }) => {
  const [itemState, setItemState] = useState(modalState.item);

  const handleQuestionContentChange = useCallback((html) => {
    setItemState(prev => ({
      ...prev,
      contentFormatted: html
    }));
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
          <RichTextEditor
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
      <QuestionEditorContainer 
        item={itemState}
        onSave={onSave}
        examBodyIndex={modalState.examBodyIndex}
        questionsIndex={modalState.questionsIndex}
      />
    );
  }

  return null;
});

const ContentRenderer = React.memo(({ record }) => {
  const textContent = useMemo(() => {
    try {
      return htmlToText(record.contentFormatted);
    } catch (error) {
      console.error('Error converting HTML to text:', error);
      return 'Error rendering content';
    }
  }, [record.contentFormatted]);

  return (
    <div style={{ 
      margin: 0, 
      maxWidth: 280,
      maxHeight: '4.5em',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {textContent}
      </div>
    </div>
  );
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
  }, [dispatch, exam]);

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
      // Delete question from section
      dispatch(removeQuestion({ examBodyIndex, questionsIndex }));
    } else if (entry?.type === "section") {
      // Delete section
      dispatch(removeSection(examBodyIndex));
    } else {
      // Delete standalone question
      dispatch(removeQuestion({ examBodyIndex }));
    }

    setModalState({ visible: false, type: '', item: null, isDelete: false });
    message.success('Item deleted successfully');
  };

  // Memoize the table data with a stable reference
  const memoizedTableData = useMemo(() => tableData || [], [tableData]);

  // Memoize the columns configuration
  const columns = useMemo(() => [
    {
      title: "Actions",
      key: "actions-column",
      fixed: 'left',
      width: 140,
      render: (_, record) => {
        if (!exam?.examBody) return null;
        
        return (
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
          return record.sectionTitle || record.sectionNumber;
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
        
        try {
          return <ContentRenderer record={record} />;
        } catch (error) {
          console.error('Error rendering content:', error);
          return <div>Error rendering content</div>;
        }
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
          <div style={{ maxHeight: 100, overflowY: 'auto', paddingRight: 4 }}>
            {record.answers.map((answer, i) => (
              <div 
                key={`${record.id}-answer-${i}`}
                style={{ 
                  margin: '2px 0',
                  color: answer.correct ? '#52c41a' : 'inherit',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {options[i]}) {htmlToText(answer.contentFormatted)}
              </div>
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
  ], [exam, handleEdit, handleMove]); // Added handleEdit and handleMove to dependencies

  if (!exam || !Array.isArray(exam.examBody)) {
    return <div>Please open an exam or create a new file.</div>;
  }

  return (
    <div>
      <Tabs
        defaultActiveKey="builder"
        items={[
          {
            key: 'builder',
            label: 'Builder',
            children: (
              <>
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
              </>
            )
          },
          {
            key: 'summary',
            label: 'Summary',
            children: (
              <SummaryTable exam={exam} />
            )
          },
          {
            key: "preview",
            label: "Preview",
            children: (
              <div style={{ marginTop: '24px' }}>
                <ExamPreview />
              </div>
            )
          }
        ]}
      />
      {/* Modal with extracted editor component */}
      <div style={{ marginBottom: 16 }}>
      </div>
      <Modal
        open={modalState.visible}
        title={modalState.isDelete ? 'Confirm Delete' : `Edit ${modalState.type === 'question' ? 'Question' : 'Section'}`}
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