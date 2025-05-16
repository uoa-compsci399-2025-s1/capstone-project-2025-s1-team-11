import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography } from 'antd';
import ContentEditor from './ContentEditor';
import { createNewExam, addSection, addQuestion } from '../../store/exam/examSlice';
import { selectSectionByIndex, selectQuestionByPath } from '../../store/exam/selectors';

const { Title } = Typography;

const EditorDemo = () => {
  const dispatch = useDispatch();
  
  // Select the data from Redux to check if it exists
  const section = useSelector(state => selectSectionByIndex(state, 0));
  const question = useSelector(state => selectQuestionByPath(state, 0, 0));

  // Initialize demo exam data when component mounts and only if data doesn't exist
  useEffect(() => {
    if (!section) {
      // Create a new exam
      dispatch(createNewExam({
        examTitle: 'Demo Exam',
        courseCode: 'DEMO101',
      }));

      // Add a section
      dispatch(addSection({
        sectionTitle: 'Demo Section',
        contentFormatted: '<p>This is a demo section with instructions.</p>'
      }));

      // Add a question to the section
      dispatch(addQuestion({
        examBodyIndex: 0,
        questionData: {
          contentFormatted: '<p>What is the capital of France?</p>',
          answers: [
            { contentFormatted: '<p>Paris</p>', correct: true },
            { contentFormatted: '<p>London</p>', correct: false },
            { contentFormatted: '<p>Berlin</p>', correct: false },
          ]
        }
      }));
    }
  }, [dispatch, section]);

  return (
    <div className="editor-demo-container">
      <Title level={2}>Content Editor Demo</Title>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Card title="Section Editor" className="demo-card">
          <ContentEditor 
            type="section"
            examBodyIndex={0}
          />
        </Card>

        <Card title="Question Editor" className="demo-card">
          <ContentEditor 
            type="question"
            examBodyIndex={0}
            questionIndex={0}
          />
        </Card>

        <Card title="Answer Editor" className="demo-card">
          <ContentEditor 
            type="answer"
            examBodyIndex={0}
            questionIndex={0}
            answerIndex={0}
          />
        </Card>
      </div>

      <div className="demo-notes" style={{ marginTop: '24px' }}>
        <Title level={4}>Editor Features</Title>
        <ul>
          <li>Each editor demonstrates editing different parts of an exam</li>
          <li>Changes are stored in Redux state</li>
          <li>Rich text formatting is preserved</li>
          <li>Live preview shows formatted content</li>
        </ul>
      </div>
    </div>
  );
};

export default EditorDemo; 