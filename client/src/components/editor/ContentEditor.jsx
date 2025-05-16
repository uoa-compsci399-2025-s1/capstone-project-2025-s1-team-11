import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from 'antd';
import CompactRichTextEditor from './CompactRichTextEditor';
import { updateQuestion, updateSection } from '../../store/exam/examSlice';
import { selectQuestionByPath, selectSectionByIndex } from '../../store/exam/selectors';

const ContentEditor = ({ 
  type, // 'section' | 'question' | 'answer'
  examBodyIndex,
  questionIndex,
  answerIndex,
  onClose
}) => {
  const dispatch = useDispatch();

  // Select the appropriate content based on type
  const content = useSelector(state => {
    if (type === 'section') {
      return selectSectionByIndex(state, examBodyIndex)?.contentFormatted || '';
    } else if (type === 'question') {
      const question = selectQuestionByPath(state, examBodyIndex, questionIndex);
      return question?.contentFormatted || '';
    } else if (type === 'answer') {
      const question = selectQuestionByPath(state, examBodyIndex, questionIndex);
      return question?.answers?.[answerIndex]?.contentFormatted || '';
    }
    return '';
  });

  // Get the current question for answer updates
  const currentQuestion = useSelector(state => 
    type === 'answer' ? selectQuestionByPath(state, examBodyIndex, questionIndex) : null
  );

  const handleContentChange = useCallback((contentFormatted, contentText) => {
    if (type === 'section') {
      dispatch(updateSection({
        examBodyIndex,
        newData: { 
          contentFormatted,
          contentText
        }
      }));
    } else if (type === 'question') {
      dispatch(updateQuestion({
        location: { examBodyIndex, questionsIndex: questionIndex },
        newData: { 
          contentFormatted,
          contentText
        }
      }));
    } else if (type === 'answer' && currentQuestion) {
      const updatedAnswers = [...(currentQuestion.answers || [])];
      if (updatedAnswers[answerIndex]) {
        updatedAnswers[answerIndex] = {
          ...updatedAnswers[answerIndex],
          contentFormatted,
          contentText
        };
        
        dispatch(updateQuestion({
          location: { examBodyIndex, questionsIndex: questionIndex },
          newData: { answers: updatedAnswers }
        }));
      }
    }
  }, [type, examBodyIndex, questionIndex, answerIndex, currentQuestion, dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <CompactRichTextEditor 
        content={content}
        onChange={handleContentChange}
        placeholder="Enter content..."
      />
      
      <Card size="small" title="Preview" styles={{ body: { padding: '8px' }}}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </Card>
    </div>
  );
};

export default ContentEditor; 