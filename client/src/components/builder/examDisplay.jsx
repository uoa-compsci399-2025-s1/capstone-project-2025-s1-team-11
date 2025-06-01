//examDisplay.jsx
import React, { useState, useMemo, useCallback } from "react";
import { Button, Typography, Modal, Input, Table } from "antd";
import { Tabs } from "antd";
import SummaryTable from "./SummaryTable";
import ExamPreview from "./ExamPreview";
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
import { htmlToText } from "../../utilities/textUtils.js";
import RichTextEditor from "../editor/RichTextEditor.jsx";
import { QuestionEditorContainer } from "./QuestionEditor.jsx";
import useMessage from "../../hooks/useMessage.js";
import { DEFAULT_OPTIONS } from '../../constants/answerOptions';

const ExamItemEditor = React.memo(({ modalState, onSave, exam }) => {
  const [itemState, setItemState] = useState(modalState.item);

  React.useEffect(() => {
    setItemState(modalState.item);
  }, [modalState.item]);

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

  const handleSectionSelectionChange = useCallback((selectedSectionIndex) => {
    setItemState(prev => ({
      ...prev,
      targetSectionIndex: selectedSectionIndex
    }));
  }, []);

  const availableSections = useMemo(() => {
    if (!exam?.examBody) return [];
    
    const sections = [{ value: 'standalone', label: 'Standalone Question (No Section)' }];
    
    exam.examBody.forEach((item, index) => {
      if (item.type === 'section') {
        sections.push({
          value: index,
          label: item.sectionTitle || `Section ${item.sectionNumber || index + 1}`
        });
      }
    });
    
    return sections;
  }, [exam]);

  const currentSectionIndex = useMemo(() => {
    if (modalState.type !== 'question') return null;
    
    if (modalState.questionsIndex !== undefined) {
      return modalState.examBodyIndex;
    }
    
    return 'standalone';
  }, [modalState]);

  React.useEffect(() => {
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
        exam={exam}
        availableSections={availableSections}
        currentSectionIndex={currentSectionIndex}
        onSectionSelectionChange={handleSectionSelectionChange}
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

  const [currentEditorState, setCurrentEditorState] = useState(null);

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

  const resetModalState = useCallback(() => {
    setModalState({
      visible: false,
      type: "", 
      item: null,
      examBodyIndex: null,
      questionsIndex: null,
      isDelete: false,
    });
    setCurrentEditorState(null);
  }, []);

  const handleEdit = useCallback((item) => {
    if (!item || typeof item.examBodyIndex !== 'number') {
      message.error('Invalid item provided');
      return;
    }

    const section = exam.examBody?.[item.examBodyIndex];
    if (!section) {
      message.error('Section not found');
      return;
    }

    const actualItem = item.type === 'section'
      ? section
      : section?.type === 'section'
        ? section.questions?.[item.questionsIndex]
        : section;

    if (!actualItem) {
      message.error('Failed to find item to edit');
      return;
    }

    setModalState({
      visible: true,
      type: item.type,
      item: structuredClone(actualItem),
      examBodyIndex: item.examBodyIndex,
      questionsIndex: item.questionsIndex,
      isDelete: false,
    });
  }, [exam, message]);

  const handleSaveEdit = useCallback(() => {
    const { type, examBodyIndex, questionsIndex } = modalState;
    
    if (!currentEditorState) return;

    if (type === "section") {
      dispatch(updateSection({
        examBodyIndex,
        newData: {
          sectionTitle: currentEditorState.sectionTitle,
          contentFormatted: currentEditorState.contentFormatted
        }
      }));
      message.success("Section updated");
    } else if (type === "question") {
      const currentSectionIndex = questionsIndex !== undefined ? examBodyIndex : 'standalone';
      const targetSectionIndex = currentEditorState.targetSectionIndex !== undefined 
        ? currentEditorState.targetSectionIndex 
        : currentSectionIndex;

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

      if (targetSectionIndex !== currentSectionIndex) {
        const source = {
          examBodyIndex,
          ...(questionsIndex !== undefined && { questionsIndex })
        };

        let destination;
        if (targetSectionIndex === 'standalone') {
          destination = { examBodyIndex: exam.examBody.length };
        } else {
          const targetSection = exam.examBody[targetSectionIndex];
          const questionsLength = targetSection?.questions?.length || 0;
          destination = { 
            examBodyIndex: targetSectionIndex, 
            questionsIndex: questionsLength 
          };
        }

        dispatch(moveQuestion({ source, destination }));
        message.success("Question updated and moved to new section");
      } else {
        message.success("Question updated");
      }
    }

    resetModalState();
  }, [currentEditorState, dispatch, modalState, resetModalState, message, exam]);

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

  const memoizedTableData = useMemo(() => tableData || [], [tableData]);

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
      render: (questionNumber, record) => {
        if (record.type === "section") {
          return '';
        }
        return questionNumber;
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type-column",
      width: 100,
      render: (type) => {
        if (type === 'section') {
          return <Text style={{ textDecoration: 'underline' }}>Section</Text>;
        }
        return 'Question';
      }
    },
    {
      title: "Section ID",
      key: "section-column",
      width: 120,
      ellipsis: true,
      render: (_, record) => {
        if (record.type === "section") {
          return (
            <Text style={{ textDecoration: 'underline' }}>
              {record.sectionTitle || `Section ${record.sectionNumber || ''}`}
            </Text>
          );
        }
        if (record.sectionNumber) {
          return record.sectionTitle || `Section ${record.sectionNumber}`;
        }
        return (
          <Text type="secondary" style={{ fontStyle: 'italic' }}>Standalone</Text>
        );
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
          console.error('Error rendering content for record:', record, error);
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
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
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
  ], [exam, handleEdit, handleMove]); 

  if (!exam || !Array.isArray(exam.examBody)) {
    return <div>Please open an exam or create a new file.</div>;
  }

  return (
    <>
      <Tabs
        defaultActiveKey="builder"
        type="card"
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

                <Table
                  key="exam-table"
                  rowKey="id"
                  columns={columns}
                  dataSource={memoizedTableData}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: "max-content" }}
                />
              </>
            )
          },
          {
            key: 'summary',
            label: 'Summary',
            children: <SummaryTable exam={exam} />
          },
          {
            key: "preview",
            label: "Preview",
            children: (
              <div style={{ marginTop: '24px' }}>
                <ExamPreview exam={exam} />
              </div>
            )
          }
        ]}
      />
      {/* Modal with extracted editor component */}
      <Modal
        open={modalState.visible}
        title={modalState.isDelete ? 'Confirm Delete' : `Edit ${modalState.type === 'question' ? 'Question' : 'Section'}`}
        onCancel={resetModalState}
        onOk={modalState.isDelete ? executeDeleteItem : handleSaveEdit}
        width={800}
      >
        {modalState.isDelete ? (
          <Paragraph>Are you sure you want to delete this item?</Paragraph>
        ) : (
          <ExamItemEditor
            key={`${modalState.type}-${modalState.examBodyIndex}-${modalState.questionsIndex ?? 'none'}`}
            modalState={modalState}
            onSave={setCurrentEditorState}
            onCancel={resetModalState}
            exam={exam}
          />
        )}
      </Modal>
    </>
  );
};

export default ExamDisplay;