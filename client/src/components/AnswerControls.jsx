import React from 'react';
import { Checkbox, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { updateQuestion } from '../store/exam/examSlice';
import { selectExamData } from '../store/exam/selectors';

const DEFAULT_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

const AnswerCheckbox = ({ question, answerIndex, examBodyIndex, questionsIndex }) => {
  const dispatch = useDispatch();

  const handleChange = (checked) => {
    const newAnswers = [...question.answers];
    newAnswers[answerIndex] = {
      ...newAnswers[answerIndex],
      correct: checked
    };

    dispatch(updateQuestion({
      location: { examBodyIndex, questionsIndex },
      newData: { answers: newAnswers }
    }));
  };

  return (
    <Checkbox
      checked={question.answers[answerIndex]?.correct || false}
      onChange={(e) => handleChange(e.target.checked)}
    />
  );
};

const AnswerSelect = ({ question, answerIndex, examBodyIndex, questionsIndex }) => {
  const dispatch = useDispatch();
  const examData = useSelector(selectExamData);
  const options = examData?.teleformOptions || DEFAULT_OPTIONS;
  
  const currentValue = question.answers[answerIndex]?.fixedPosition !== null
    ? question.answers[answerIndex].fixedPosition.toString()
    : 'random';

  // Get list of already selected positions (except current answer's position)
  const selectedPositions = question.answers
    .map((answer, idx) => idx !== answerIndex && answer.fixedPosition !== null ? answer.fixedPosition.toString() : null)
    .filter(pos => pos !== null);

  const handleChange = (value) => {
    const newAnswers = [...question.answers];
    newAnswers[answerIndex] = {
      ...newAnswers[answerIndex],
      fixedPosition: value === 'random' ? null : parseInt(value)
    };

    dispatch(updateQuestion({
      location: { examBodyIndex, questionsIndex },
      newData: { answers: newAnswers }
    }));
  };

  return (
    <Select
      value={currentValue}
      onChange={handleChange}
      style={{ width: 100 }}
    >
      <Select.Option value="random">random</Select.Option>
      {options.map((letter, index) => (
        <Select.Option 
          key={index.toString()} 
          value={index.toString()}
          disabled={selectedPositions.includes(index.toString())}
        >
          {letter}
        </Select.Option>
      ))}
    </Select>
  );
};

export const AnswerControls = {
  Checkbox: AnswerCheckbox,
  Select: AnswerSelect
};

export default AnswerControls; 