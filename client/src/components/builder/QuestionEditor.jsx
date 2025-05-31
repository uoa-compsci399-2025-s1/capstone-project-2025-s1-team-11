import React, { useState, useCallback, Suspense, useEffect } from "react";
import { Input, Checkbox, Select, InputNumber, Space, Typography, Row, Col } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateQuestion } from "../../store/exam/examSlice.js";
import { selectExamData } from "../../store/exam/selectors.js";
import RichTextEditor from "../editor/RichTextEditor.jsx";
import { DEFAULT_OPTIONS } from '../../constants/answerOptions';

const { Text } = Typography;

// Memoized Question Editor Component
const QuestionEditor = React.memo(({ 
  question, 
  examBodyIndex, 
  questionsIndex,
  onQuestionChange 
}) => {
  const dispatch = useDispatch();

  const handleQuestionContentChange = useCallback((html) => {
    onQuestionChange(html);
  }, [onQuestionChange]);

  const handleMarksChange = useCallback((value) => {
    dispatch(updateQuestion({
      location: { 
        examBodyIndex, 
        questionsIndex,
        questionId: question.id
      },
      newData: { marks: value }
    }));
  }, [dispatch, examBodyIndex, questionsIndex, question.id]);

  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={16} align="top">
        <Col flex="auto">
          <RichTextEditor
            key="question-editor"
            content={question.contentFormatted}
            onChange={handleQuestionContentChange}
            placeholder="Question Text"
          />
        </Col>
        <Col>
          <Space direction="vertical">
            <Text strong>Marks:</Text>
            <InputNumber
              min={0}
              value={question.marks}
              onChange={handleMarksChange}
              style={{ width: '80px' }}
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
});

// Memoized Answer Editor Component with correct and map-to controls
const AnswerEditor = React.memo(({ 
  answer, 
  index, 
  onChange, 
  question,
  onCorrectChange,
  onMapToChange
}) => {
  const exam = useSelector(selectExamData);
  const options = exam?.teleformOptions || DEFAULT_OPTIONS;

  const handleChange = useCallback((html) => {
    onChange(html, index);
  }, [onChange, index]);

  const handleCorrectChange = useCallback((checked) => {
    // Only update local state during editing
    onCorrectChange(index, checked);
    
    // Don't update Redux during editing - will be done on save
  }, [index, onCorrectChange]);

  const handleMapToChange = useCallback((value) => {
    // Only update local state during editing
    onMapToChange(index, value);
    
    // Don't update Redux during editing - will be done on save
  }, [index, onMapToChange]);

  // Get list of already selected positions (except current answer's position)
  const selectedPositions = question.answers
    .map((ans, idx) => idx !== index && ans.fixedPosition !== null ? ans.fixedPosition.toString() : null)
    .filter(pos => pos !== null);

  const currentValue = answer.fixedPosition !== null
    ? answer.fixedPosition.toString()
    : 'random';

  return (
    <div style={{ marginBottom: 8 }}>
      <Row gutter={8} align="middle">
        <Col flex="auto">
          <RichTextEditor
            key={`answer-editor-${index}`}
            content={answer.contentFormatted}
            onChange={handleChange}
            placeholder={`Answer ${options[index] || String(index + 1)}`}
          />
        </Col>
        <Col style={{ width: '80px', textAlign: 'center' }}>
          <Checkbox
            checked={answer.correct || false}
            onChange={(e) => handleCorrectChange(e.target.checked)}
          />
        </Col>
        <Col style={{ width: '120px', textAlign: 'center' }}>
          <Select
            value={currentValue}
            onChange={handleMapToChange}
            style={{ width: 100 }}
          >
            <Select.Option value="random">random</Select.Option>
            {options.map((letter, idx) => (
              <Select.Option 
                key={idx.toString()} 
                value={idx.toString()}
                disabled={selectedPositions.includes(idx.toString())}
              >
                {letter}
              </Select.Option>
            ))}
          </Select>
        </Col>
      </Row>
    </div>
  );
});

// Lazy loaded answer editors container
const AnswerEditorsContainer = React.memo(({ 
  answers, 
  onAnswerChange, 
  examBodyIndex, 
  questionsIndex,
  question,
  onCorrectChange,
  onMapToChange
}) => {
  return (
    <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
      <Row gutter={8} align="middle" style={{ marginBottom: 12, marginTop: 16 }}>
        <Col flex="auto">
          <Text strong>Answers</Text>
        </Col>
        <Col style={{ width: '80px', textAlign: 'center' }}>
          <Text strong>Correct</Text>
        </Col>
        <Col style={{ width: '120px', textAlign: 'center' }}>
          <Text strong>Set Position</Text>
        </Col>
      </Row>
      {answers.map((answer, index) => (
        <AnswerEditor
          key={`${answer.id || index}`}
          answer={answer}
          index={index}
          onChange={onAnswerChange}
          examBodyIndex={examBodyIndex}
          questionsIndex={questionsIndex}
          question={question}
          onCorrectChange={onCorrectChange}
          onMapToChange={onMapToChange}
        />
      ))}
    </div>
  );
});

// Main component for the exam item editor
const QuestionEditorContainer = ({ 
  item, 
  onSave, 
  examBodyIndex, 
  questionsIndex, 
  availableSections, 
  currentSectionIndex, 
  onSectionSelectionChange 
}) => {
  const [itemState, setItemState] = useState(item);
  const dispatch = useDispatch();
  
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
  
  const handleAnswerCorrectChange = useCallback((index, checked) => {
    setItemState(prev => {
      const updatedAnswers = [...prev.answers];
      updatedAnswers[index] = {
        ...updatedAnswers[index],
        correct: checked
      };
      return {
        ...prev,
        answers: updatedAnswers
      };
    });
  }, []);
  
  const handleAnswerMapToChange = useCallback((index, value) => {
    setItemState(prev => {
      const updatedAnswers = [...prev.answers];
      updatedAnswers[index] = {
        ...updatedAnswers[index],
        fixedPosition: value === 'random' ? null : parseInt(value)
      };
      return {
        ...prev,
        answers: updatedAnswers
      };
    });
  }, []);

  const handleSectionSelectionChange = useCallback((selectedSectionIndex) => {
    setItemState(prev => ({
      ...prev,
      targetSectionIndex: selectedSectionIndex
    }));
    onSectionSelectionChange(selectedSectionIndex);
  }, [onSectionSelectionChange]);

  // Save changes to Redux when component unmounts or when modal closes
  useEffect(() => {
    return () => {
      // Apply the batch update to Redux once on unmount
      if (itemState !== item) {
        dispatch(updateQuestion({
          location: {
            examBodyIndex,
            questionsIndex,
            questionId: itemState.id
          },
          newData: {
            contentFormatted: itemState.contentFormatted,
            marks: itemState.marks,
            answers: itemState.answers
          }
        }));
      }
    };
  }, [dispatch, examBodyIndex, questionsIndex, itemState, item]);

  // Pass the current state up to parent when changes are made
  useEffect(() => {
    onSave(itemState);
  }, [itemState, onSave]);

  return (
    <>
      {availableSections && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Section:</Text>
          <Select
            value={itemState?.targetSectionIndex !== undefined ? itemState.targetSectionIndex : currentSectionIndex}
            onChange={handleSectionSelectionChange}
            options={availableSections}
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Select section for this question"
          />
        </div>
      )}
      
      <QuestionEditor
        question={itemState}
        onQuestionChange={handleQuestionContentChange}
        examBodyIndex={examBodyIndex}
        questionsIndex={questionsIndex}
      />
      <Suspense fallback={<div>Loading answer editors...</div>}>
        <AnswerEditorsContainer
          answers={itemState?.answers || []}
          onAnswerChange={handleAnswerContentChange}
          examBodyIndex={examBodyIndex}
          questionsIndex={questionsIndex}
          question={itemState}
          onCorrectChange={handleAnswerCorrectChange}
          onMapToChange={handleAnswerMapToChange}
        />
      </Suspense>
    </>
  );
};

export { 
  QuestionEditor, 
  AnswerEditor, 
  AnswerEditorsContainer, 
  QuestionEditorContainer 
}; 