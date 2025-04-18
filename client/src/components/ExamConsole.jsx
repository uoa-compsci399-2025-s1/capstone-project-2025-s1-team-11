// src/components/ExamConsole.js
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createNewExam, 
  addSection,
  addQuestion,
  updateExamMetadata,
  updateSection,
  updateQuestion,
  removeSection,
  removeQuestion
} from '../store/exam/examSlice';

function ExamConsole() {
  const dispatch = useDispatch();
  const exam = useSelector(state => state.exam);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const outputEndRef = useRef(null);
  
  // Scroll to bottom of output
  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Add line to output
  const addToOutput = (text, type = 'text') => {
    setOutput(prev => [...prev, { text, type }]);
    setTimeout(scrollToBottom, 10);
  };
  
  // Clear the output
  const clearOutput = () => {
    setOutput([]);
  };
  
  // Display current exam state
  const displayExam = () => {
    if (!exam) {
      addToOutput('No exam is currently loaded.', 'error');
      return;
    }
    
    addToOutput(JSON.stringify(exam, null, 2), 'code');
  };
  
  // Process commands
  const processCommand = () => {
    const trimmedCommand = command.trim();
    addToOutput(`> ${trimmedCommand}`, 'command');
    
    // Split command into parts
    const parts = trimmedCommand.split(' ');
    const mainCommand = parts[0].toLowerCase();
    
    try {
      switch (mainCommand) {
        case 'help':
          showHelp();
          break;
          
        case 'clear':
          clearOutput();
          break;
          
        case 'create-exam':
          // Format: create-exam "Exam Title" "CS101" "Intro to CS" "Fall" 2023
          if (parts.length < 6) {
            addToOutput('Usage: create-exam "Title" "CourseCode" "CourseName" "Semester" Year', 'error');
            break;
          }
          
          // Parse quoted arguments
          const examArgs = parseQuotedArgs(trimmedCommand);
          if (examArgs.length < 5) {
            addToOutput('Error parsing arguments. Make sure to use quotes for text with spaces.', 'error');
            break;
          }
          
          dispatch(createNewExam({
            examTitle: examArgs[1],
            courseCode: examArgs[2],
            courseName: examArgs[3],
            semester: examArgs[4],
            year: parseInt(examArgs[5]) || new Date().getFullYear()
          }));
          
          addToOutput('Exam created successfully!', 'success');
          break;
          
        case 'add-section':
          // Format: add-section "Section Title" "Optional HTML content"
          if (!exam) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: add-section "Title" "Optional Content"', 'error');
            break;
          }
          
          const sectionArgs = parseQuotedArgs(trimmedCommand);
          
          dispatch(addSectionToExam({
            sectionTitle: sectionArgs[1] || 'New Section',
            content: sectionArgs[2] || ''
          }));
          
          addToOutput('Section added successfully!', 'success');
          break;
          
        case 'add-question':
          // Format: add-question 0 "Question content" 2 "Option A" "Option B" "Option C" "Option D" "Option E" 0
          if (!exam) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          const questionArgs = parseQuotedArgs(trimmedCommand);
          if (questionArgs.length < 4) {
            addToOutput('Usage: add-question SectionIndex "Content" Marks "Option A" "Option B"... CorrectAnswerIndex', 'error');
            break;
          }
          
          const sectionIndex = parseInt(questionArgs[1]);
          if (isNaN(sectionIndex) || sectionIndex < 0 || 
              !exam.examBody[sectionIndex] || 
              exam.examBody[sectionIndex].type !== 'Section') {
            addToOutput('Invalid section index', 'error');
            break;
          }
          
          const questionContent = questionArgs[2];
          const marks = parseInt(questionArgs[3]) || 1;
          
          // Get answers (options)
          const answers = [];
          for (let i = 4; i < Math.min(questionArgs.length - 1, 9); i++) {
            answers.push(questionArgs[i] || '');
          }
          
          // Pad answers to 5 items
          while (answers.length < 5) {
            answers.push('');
          }
          
          // Get correct answer index
          let correctIndex = parseInt(questionArgs[questionArgs.length - 1]) || 0;
          if (correctIndex < 0 || correctIndex >= answers.length) {
            correctIndex = 0;
          }
          
          // Create correctAnswers array
          const correctAnswers = Array(5).fill(0);
          correctAnswers[correctIndex] = 1;
          
          dispatch(addQuestionToSection({
            sectionIndex,
            questionData: {
              content: questionContent,
              marks,
              answers,
              correctAnswers
            }
          }));
          
          addToOutput('Question added successfully!', 'success');
          break;
          
        case 'update-exam':
          // Format: update-exam "field" "value"
          if (!exam) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 3) {
            addToOutput('Usage: update-exam "field" "value"', 'error');
            break;
          }
          
          const updateArgs = parseQuotedArgs(trimmedCommand);
          const field = updateArgs[1].toLowerCase();
          const value = updateArgs[2];
          
          // Create update object
          const updateData = {};
          switch (field) {
            case 'title':
            case 'examtitle':
              updateData.examTitle = value;
              break;
            case 'code':
            case 'coursecode':
              updateData.courseCode = value;
              break;
            case 'name':
            case 'coursename':
              updateData.courseName = value;
              break;
            case 'semester':
              updateData.semester = value;
              break;
            case 'year':
              updateData.year = parseInt(value) || new Date().getFullYear();
              break;
            default:
              addToOutput(`Unknown field: ${field}`, 'error');
              return;
          }
          
          dispatch(updateExamMetadata(updateData));
          addToOutput(`Updated exam ${field} to: ${value}`, 'success');
          break;
          
        case 'show':
          // Format: show exam or show section 0 or show question 0 1
          if (!exam) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: show exam | show section INDEX | show question SECTION_INDEX QUESTION_INDEX', 'error');
            break;
          }
          
          const showType = parts[1].toLowerCase();
          
          if (showType === 'exam') {
            displayExam();
          } else if (showType === 'section' && parts.length >= 3) {
            const idx = parseInt(parts[2]);
            if (isNaN(idx) || idx < 0 || !exam.examBody[idx] || exam.examBody[idx].type !== 'Section') {
              addToOutput('Invalid section index', 'error');
              break;
            }
            
            addToOutput(JSON.stringify(exam.examBody[idx], null, 2), 'code');
          } else if (showType === 'question' && parts.length >= 4) {
            const secIdx = parseInt(parts[2]);
            const qIdx = parseInt(parts[3]);
            
            if (isNaN(secIdx) || secIdx < 0 || !exam.examBody[secIdx] || 
                exam.examBody[secIdx].type !== 'Section' ||
                isNaN(qIdx) || qIdx < 0 || !exam.examBody[secIdx].questions[qIdx]) {
              addToOutput('Invalid section or question index', 'error');
              break;
            }
            
            addToOutput(JSON.stringify(exam.examBody[secIdx].questions[qIdx], null, 2), 'code');
          } else {
            addToOutput('Invalid show command', 'error');
          }
          break;
          
        case 'remove-section':
          // Format: remove-section 0
          if (!exam) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: remove-section INDEX', 'error');
            break;
          }
          
          const remSectionIdx = parseInt(parts[1]);
          if (isNaN(remSectionIdx) || remSectionIdx < 0 || 
              !exam.examBody[remSectionIdx] || 
              exam.examBody[remSectionIdx].type !== 'Section') {
            addToOutput('Invalid section index', 'error');
            break;
          }
          
          dispatch(removeSection({ sectionIndex: remSectionIdx }));
          addToOutput('Section removed successfully!', 'success');
          break;
          
        case 'remove-question':
          // Format: remove-question 0 1
          if (!exam) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 3) {
            addToOutput('Usage: remove-question SECTION_INDEX QUESTION_INDEX', 'error');
            break;
          }
          
          const remSectionIdx2 = parseInt(parts[1]);
          const remQuestionIdx = parseInt(parts[2]);
          
          if (isNaN(remSectionIdx2) || remSectionIdx2 < 0 || 
              !exam.examBody[remSectionIdx2] || 
              exam.examBody[remSectionIdx2].type !== 'Section' ||
              isNaN(remQuestionIdx) || remQuestionIdx < 0 || 
              !exam.examBody[remSectionIdx2].questions[remQuestionIdx]) {
            addToOutput('Invalid section or question index', 'error');
            break;
          }
          
          dispatch(removeQuestion({ 
            sectionIndex: remSectionIdx,
            questionIndex: remQuestionIdx
          }));
          
          addToOutput('Question removed successfully!', 'success');
          break;
          
        default:
          addToOutput(`Unknown command: ${mainCommand}. Type 'help' for available commands.`, 'error');
      }
    } catch (err) {
      addToOutput(`Error: ${err.message}`, 'error');
    }
    
    // Clear command input
    setCommand('');
  };
  
  // Handle command input
  const handleCommandChange = (e) => {
    setCommand(e.target.value);
  };
  
  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      processCommand();
    }
  };
  
  // Parse quoted arguments (handles spaces in arguments)
  const parseQuotedArgs = (cmdString) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < cmdString.length; i++) {
      const char = cmdString[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          result.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      result.push(current);
    }
    
    return result;
  };
  
  // Show help text
  const showHelp = () => {
    addToOutput('Available commands:', 'heading');
    addToOutput('help - Show this help message', 'text');
    addToOutput('clear - Clear the console output', 'text');
    addToOutput('create-exam "Title" "CourseCode" "CourseName" "Semester" Year - Create a new exam', 'text');
    addToOutput('add-section "Title" "Optional Content" - Add a section to the current exam', 'text');
    addToOutput('add-question SectionIndex "Content" Marks "Option A" "Option B"... CorrectAnswerIndex - Add a question', 'text');
    addToOutput('update-exam "field" "value" - Update exam metadata (title, code, name, semester, year)', 'text');
    addToOutput('show exam - Display the entire current exam', 'text');
    addToOutput('show section INDEX - Display a specific section', 'text');
    addToOutput('show question SECTION_INDEX QUESTION_INDEX - Display a specific question', 'text');
    addToOutput('remove-section INDEX - Remove a section', 'text');
    addToOutput('remove-question SECTION_INDEX QUESTION_INDEX - Remove a question', 'text');
  };

  return (
    <div className="exam-console" style={{ 
      width: '100%', 
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <h2>Exam Builder Console</h2>
      <p>Type commands to build and edit exams. Type 'help' for available commands.</p>
      
      <div className="console-output" style={{
        backgroundColor: '#1e1e1e',
        color: '#f0f0f0',
        padding: '10px',
        borderRadius: '5px',
        height: '400px',
        overflow: 'auto',
        marginBottom: '10px'
      }}>
        {output.map((line, index) => {
          let style = {};
          
          switch (line.type) {
            case 'error':
              style = { color: '#f44336' };
              break;
            case 'success':
              style = { color: '#4caf50' };
              break;
            case 'command':
              style = { color: '#2196f3', fontWeight: 'bold' };
              break;
            case 'code':
              style = { 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#2d2d2d',
                padding: '5px',
                borderRadius: '3px',
                fontFamily: 'monospace',
                color: '#e6e6e6'
              };
              break;
            case 'heading':
              style = { fontWeight: 'bold', color: '#ff9800' };
              break;
            default:
              style = {};
          }
          
          return (
            <div key={index} style={style}>
              {line.text}
            </div>
          );
        })}
        <div ref={outputEndRef} />
      </div>
      
      <div className="console-input" style={{
        display: 'flex',
        gap: '10px'
      }}>
        <span style={{ padding: '5px' }}>{'>'}</span>
        <input
          type="text"
          value={command}
          onChange={handleCommandChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          style={{
            flexGrow: 1,
            padding: '5px 10px',
            fontFamily: 'monospace'
          }}
        />
        <button onClick={processCommand} style={{
          padding: '5px 15px',
          cursor: 'pointer'
        }}>
          Execute
        </button>
      </div>
      
      <div className="console-status" style={{
        marginTop: '10px',
        padding: '5px',
        borderRadius: '3px',
        backgroundColor: '#f0f0f0'
      }}>
        {exam ? (
          <span>Current exam: <strong>{exam.examTitle}</strong> ({exam.courseCode})</span>
        ) : (
          <span>No exam loaded</span>
        )}
      </div>
    </div>
  );
}

export default ExamConsole;