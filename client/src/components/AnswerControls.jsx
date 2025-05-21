import React from 'react';
import { Checkbox, Select } from 'antd';
import { useDispatch } from 'react-redux';
import { updateQuestion } from '../store/exam/examSlice';

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
  const options = ['random', '0', '1', '2', '3', '4'];
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
      {options.slice(1).map(pos => (
        <Select.Option 
          key={pos} 
          value={pos}
          disabled={selectedPositions.includes(pos)}
        >
          {parseInt(pos) + 1}
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