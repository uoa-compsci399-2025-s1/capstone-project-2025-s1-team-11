import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createNewExam, 
  clearExam,
  addSection,
  addQuestion,
  removeCoverPage,
  removeAppendix,
  updateQuestion, 
  updateSection,
  moveQuestionToSection,
  moveQuestion,
  removeQuestion,
  removeSection,
  updateExamField,
  updateExamMetadata,
  setExamVersions,
  setTeleformOptions,
  shuffleAnswers,
  setCoverPage,
  setAppendix
} from '../store/exam/examSlice';

import {
  selectExamState,
  selectExamData,
  selectExamMetadata,
  selectExamBody,
  selectExamStatus,
  selectExamError,
  selectSectionByIndex,
  selectQuestionByPath,
  selectQuestionByNumber,
  selectAllQuestionsFlat,
  selectQuestionsForTable,
  selectTotalMarks,
} from '../store/exam/selectors';

function ExamConsole() {
  const dispatch = useDispatch();
  const examState = useSelector(selectExamState);
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
  
  // Display JSON objects nicely
  const displayJSON = (data) => {
    if (data === null || data === undefined) {
      addToOutput('Null or undefined value', 'error');
      return;
    }
    
    try {
      const jsonString = JSON.stringify(data, null, 2);
      addToOutput(jsonString, 'code');
    } catch (err) {
      addToOutput(`Error displaying object: ${err.message}`, 'error');
    }
  };
  
  // Process selectors
  const runSelector = (selectorName, ...args) => {
    try {
      // Create a function that will get the selector's result from the store
      const getSelectorResult = (selector, ...selectorArgs) => {
        const store = { exam: examState };
        return selector(store, ...selectorArgs);
      };
      
      // Match selector name and run it
      switch (selectorName.toLowerCase()) {
        case 'examstate':
          displayJSON(getSelectorResult(selectExamState));
          break;
        case 'examdata':
          displayJSON(getSelectorResult(selectExamData));
          break;
        case 'metadata':
          displayJSON(getSelectorResult(selectExamMetadata));
          break;
        case 'exambody':
          displayJSON(getSelectorResult(selectExamBody));
          break;
        case 'status':
          displayJSON(getSelectorResult(selectExamStatus));
          break;
        case 'error':
          displayJSON(getSelectorResult(selectExamError));
          break;
        case 'section':
          if (args.length < 1) {
            addToOutput('Usage: selector section INDEX', 'error');
            return;
          }
          displayJSON(getSelectorResult(selectSectionByIndex, parseInt(args[0])));
          break;
        case 'question-path':
          if (args.length < 2) {
            addToOutput('Usage: selector question-path EXAMBODY_INDEX QUESTION_INDEX', 'error');
            return;
          }
          displayJSON(getSelectorResult(selectQuestionByPath, parseInt(args[0]), parseInt(args[1])));
          break;
        case 'question-number':
          if (args.length < 1) {
            addToOutput('Usage: selector question-number QUESTION_NUMBER', 'error');
            return;
          }
          displayJSON(getSelectorResult(selectQuestionByNumber, parseInt(args[0])));
          break;
        case 'all-questions':
          displayJSON(getSelectorResult(selectAllQuestionsFlat));
          break;
        case 'table-questions':
          displayJSON(getSelectorResult(selectQuestionsForTable));
          break;
        case 'total-marks':
          displayJSON(getSelectorResult(selectTotalMarks));
          break;
        default:
          addToOutput(`Unknown selector: ${selectorName}`, 'error');
      }
    } catch (err) {
      addToOutput(`Error running selector: ${err.message}`, 'error');
    }
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
          
        case 'clear-exam':
          dispatch(clearExam());
          addToOutput('Exam cleared successfully!', 'success');
          break;
          
        case 'add-section':
          // Format: add-section "Section Title" "Optional description"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: add-section "Title" "Optional Description"', 'error');
            break;
          }
          
          const sectionArgs = parseQuotedArgs(trimmedCommand);
          
          dispatch(addSection({
            title: sectionArgs[1] || 'New Section',
            description: sectionArgs[2] || ''
          }));
          
          addToOutput('Section added successfully!', 'success');
          break;
          
        case 'add-question':
          // Format: add-question EXAMBODY_INDEX "Question content" MARKS
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          const questionArgs = parseQuotedArgs(trimmedCommand);
          if (questionArgs.length < 3) {
            addToOutput('Usage: add-question "Content" MARKS EXAMBODY_INDEX', 'error');
            break;
          }
          
          const questionContent = questionArgs[1];
          const marks = parseInt(questionArgs[2]) || 1;

          const payload = {
            questionData: {
              content: questionContent,
              marks,
              answers: ['', '', '', '', ''],
              correctAnswers: [1, 0, 0, 0, 0],
              answerShuffleMap: null,
              lockedPositionsMap: [-1, -1, -1, -1, -1]
            }
          }

          if (questionArgs.length === 4) {
            const examBodyIndex = parseInt(questionArgs[3]);
            if (isNaN(examBodyIndex) || examBodyIndex < 0) {
            addToOutput('Invalid examBody index', 'error');
            break;
            }
            payload.examBodyIndex = examBodyIndex;
          }
         
          dispatch(addQuestion(payload));
          
          addToOutput('Question added successfully!', 'success');
          break;
        
        case 'set-cover-page':
          // Format: set-cover-page "Content" "Format"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          const coverArgs = parseQuotedArgs(trimmedCommand);
          if (coverArgs.length < 3) {
            addToOutput('Usage: set-cover-page "Content" "Format"', 'error');
            break;
          }
          
          dispatch(setCoverPage({
            contentFormatted: coverArgs[1] || '',
            format: coverArgs[2] || 'HTML'
          }));
          
          addToOutput('Cover page set successfully!', 'success');
          break;
          
        case 'set-appendix':
          // Format: set-appendix "Content" "Format"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          const appendixArgs = parseQuotedArgs(trimmedCommand);
          if (appendixArgs.length < 3) {
            addToOutput('Usage: set-appendix "Content" "Format"', 'error');
            break;
          }
          
          dispatch(setAppendix({
            contentFormatted: appendixArgs[1] || '',
            format: appendixArgs[2] || 'HTML'
          }));
          
          addToOutput('Appendix set successfully!', 'success');
          break;
          
        case 'remove-cover-page':
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          dispatch(removeCoverPage());
          addToOutput('Cover page removed successfully!', 'success');
          break;
          
        case 'remove-appendix':
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          dispatch(removeAppendix());
          addToOutput('Appendix removed successfully!', 'success');
          break;
          
        case 'update-question':
          // Format: update-question EXAMBODY_INDEX QUESTION_INDEX "field" "value"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 5) {
            addToOutput('Usage: update-question EXAMBODY_INDEX QUESTION_INDEX "field" "value"', 'error');
            break;
          }
          
          const updateQuestionArgs = parseQuotedArgs(trimmedCommand);
          const exBodyIdx = parseInt(updateQuestionArgs[1]);
          const qIdx = parseInt(updateQuestionArgs[2]);
          const qField = updateQuestionArgs[3].toLowerCase();
          const qValue = updateQuestionArgs[4];
          
          // Create location object
          const location = {
            examBodyIndex: exBodyIdx
          };
          
          // Check if it's a section or direct question
          const exBodyItem = examState.examData.examBody[exBodyIdx];
          if (!exBodyItem) {
            addToOutput('Invalid examBody index', 'error');
            break;
          }
          
          if (exBodyItem.type === 'section') {
            location.questionsIndex = qIdx;
          }
          
          // Create update data object
          const qUpdateData = {};
          switch (qField) {
            case 'content':
              qUpdateData.content = qValue;
              break;
            case 'marks':
              qUpdateData.marks = parseInt(qValue) || 1;
              break;
            case 'answer':
              const answerParts = qValue.split(',');
              if (answerParts.length < 2) {
                addToOutput('For answer field, use format: "answer,INDEX,VALUE"', 'error');
                break;
              }
              const answerIdx = parseInt(answerParts[0]);
              const answerValue = answerParts[1];
              
              // Create answers array if needed
              qUpdateData.answers = [...(exBodyItem.type === 'section' 
                ? exBodyItem.questions[qIdx].answers || ['', '', '', '', ''] 
                : exBodyItem.answers || ['', '', '', '', ''])];
              
              // Update specific answer
              if (answerIdx >= 0 && answerIdx < qUpdateData.answers.length) {
                qUpdateData.answers[answerIdx] = answerValue;
              }
              break;
            case 'correct':
              const correctIdx = parseInt(qValue);
              
              // Create correctAnswers array (all 0s, then 1 at correct index)
              qUpdateData.correctAnswers = [0, 0, 0, 0, 0];
              if (correctIdx >= 0 && correctIdx < 5) {
                qUpdateData.correctAnswers[correctIdx] = 1;
              }
              break;
            default:
              addToOutput(`Unknown question field: ${qField}`, 'error');
              return;
          }
          
          dispatch(updateQuestion({ location, newData: qUpdateData }));
          addToOutput(`Updated question ${qField} successfully!`, 'success');
          break;
          
        case 'update-section':
          // Format: update-section EXAMBODY_INDEX "field" "value"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 4) {
            addToOutput('Usage: update-section EXAMBODY_INDEX "field" "value"', 'error');
            break;
          }
          
          const updateSectionArgs = parseQuotedArgs(trimmedCommand);
          const secIdx = parseInt(updateSectionArgs[1]);
          const secField = updateSectionArgs[2].toLowerCase();
          const secValue = updateSectionArgs[3];
          
          // Check if valid section
          const section = examState.examData.examBody[secIdx];
          if (!section || section.type !== 'section') {
            addToOutput('Invalid section index', 'error');
            break;
          }
          
          // Create update data object
          const secUpdateData = {};
          switch (secField) {
            case 'title':
              secUpdateData.title = secValue;
              break;
            case 'description':
              secUpdateData.description = secValue;
              break;
            default:
              addToOutput(`Unknown section field: ${secField}`, 'error');
              return;
          }
          
          dispatch(updateSection({ examBodyIndex: secIdx, newData: secUpdateData }));
          addToOutput(`Updated section ${secField} successfully!`, 'success');
          break;
          
        case 'move-question-to-section':
          // Format: move-question-to-section FROM_INDEX TO_SECTION_INDEX
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 3) {
            addToOutput('Usage: move-question-to-section FROM_INDEX TO_SECTION_INDEX', 'error');
            break;
          }
          
          const fromIndex = parseInt(parts[1]);
          const toSectionIndex = parseInt(parts[2]);
          
          // Validate indices
          if (isNaN(fromIndex) || fromIndex < 0 || fromIndex >= examState.examData.examBody.length) {
            addToOutput('Invalid from index', 'error');
            break;
          }
          
          if (isNaN(toSectionIndex) || toSectionIndex < 0 || 
              toSectionIndex >= examState.examData.examBody.length ||
              examState.examData.examBody[toSectionIndex].type !== 'section') {
            addToOutput('Invalid to section index', 'error');
            break;
          }
          
          dispatch(moveQuestionToSection({ fromIndex, toSectionIndex }));
          addToOutput('Question moved to section successfully!', 'success');
          break;
          
        case 'move-question':
          // Format: move-question "source.examBodyIndex[.questionsIndex]" "dest.examBodyIndex[.questionsIndex]"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 3) {
            addToOutput('Usage: move-question "source.examBodyIndex[.questionsIndex]" "dest.examBodyIndex[.questionsIndex]"', 'error');
            addToOutput('Example: move-question "0.1" "2.0" (moves question 1 in section 0 to first position in section 2)', 'text');
            addToOutput('Example: move-question "0" "1" (moves examBody item 0 to position 1)', 'text');
            break;
          }
          
          // Parse source and destination
          const sourceStr = parts[1];
          const destStr = parts[2];
          
          const source = {};
          const destination = {};
          
          // Parse source
          const sourceParts = sourceStr.split('.');
          source.examBodyIndex = parseInt(sourceParts[0]);
          if (sourceParts.length > 1) {
            source.questionsIndex = parseInt(sourceParts[1]);
          }
          
          // Parse destination
          const destParts = destStr.split('.');
          destination.examBodyIndex = parseInt(destParts[0]);
          if (destParts.length > 1) {
            destination.questionsIndex = parseInt(destParts[1]);
          }
          
          // Validate source and destination
          if (isNaN(source.examBodyIndex) || source.examBodyIndex < 0 || 
              source.examBodyIndex >= examState.examData.examBody.length) {
            addToOutput('Invalid source examBody index', 'error');
            break;
          }
          
          if ('questionsIndex' in source) {
            const sourceSection = examState.examData.examBody[source.examBodyIndex];
            if (sourceSection.type !== 'section' || !sourceSection.questions || 
                source.questionsIndex < 0 || source.questionsIndex >= sourceSection.questions.length) {
              addToOutput('Invalid source question index', 'error');
              break;
            }
          }
          
          if (isNaN(destination.examBodyIndex) || destination.examBodyIndex < 0 || 
              destination.examBodyIndex >= examState.examData.examBody.length) {
            addToOutput('Invalid destination examBody index', 'error');
            break;
          }
          
          if ('questionsIndex' in destination) {
            const destSection = examState.examData.examBody[destination.examBodyIndex];
            if (destSection.type !== 'section' || !destSection.questions ||
                destination.questionsIndex < 0 || destination.questionsIndex > destSection.questions.length) {
              addToOutput('Invalid destination question index', 'error');
              break;
            }
          }
          
          dispatch(moveQuestion({ source, destination }));
          addToOutput('Question moved successfully!', 'success');
          break;
          
        case 'remove-section':
          // Format: remove-section INDEX
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: remove-section INDEX', 'error');
            break;
          }
          
          const remSectionIdx = parseInt(parts[1]);
          if (isNaN(remSectionIdx) || remSectionIdx < 0 || 
              !examState.examData.examBody[remSectionIdx] || 
              examState.examData.examBody[remSectionIdx].type !== 'section') {
            addToOutput('Invalid section index', 'error');
            break;
          }
          
          dispatch(removeSection(remSectionIdx));
          addToOutput('Section removed successfully!', 'success');
          break;
          
        case 'remove-question':
          // Format: remove-question [SECTION_INDEX.]QUESTION_INDEX
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: remove-question [SECTION_INDEX.]QUESTION_INDEX', 'error');
            addToOutput('Example: remove-question 1.2 (removes question 2 in section 1)', 'text');
            addToOutput('Example: remove-question 3 (removes examBody item 3)', 'text');
            break;
          }
          
          const locationStr = parts[1];
          const locationParts = locationStr.split('.');
          
          const location2 = {};
          location.examBodyIndex = parseInt(locationParts[0]);
          
          if (locationParts.length > 1) {
            location2.questionsIndex = parseInt(locationParts[1]);
          }
          
          dispatch(removeQuestion(location2));
          addToOutput('Question removed successfully!', 'success');
          break;
          
        case 'update-exam-field':
          // Format: update-exam-field "field" "value"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 3) {
            addToOutput('Usage: update-exam-field "field" "value"', 'error');
            break;
          }
          
          const updateFieldArgs = parseQuotedArgs(trimmedCommand);
          const fieldName = updateFieldArgs[1];
          const fieldValue = updateFieldArgs[2];
          
          dispatch(updateExamField({ field: fieldName, value: fieldValue }));
          addToOutput(`Updated exam field "${fieldName}" successfully!`, 'success');
          break;
          
        case 'update-exam-metadata':
          // Format: update-exam-metadata "key" "value"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 3) {
            addToOutput('Usage: update-exam-metadata "key" "value"', 'error');
            break;
          }
          
          const metadataArgs = parseQuotedArgs(trimmedCommand);
          const metaKey = metadataArgs[1];
          const metaValue = metadataArgs[2];
          
          // Create metadata update object
          const metadataUpdate = {};
          metadataUpdate[metaKey] = metaValue;
          
          dispatch(updateExamMetadata(metadataUpdate));
          addToOutput(`Updated exam metadata "${metaKey}" successfully!`, 'success');
          break;
          
        case 'set-exam-versions':
          // Format: set-exam-versions "version1,version2,version3"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: set-exam-versions "version1,version2,version3"', 'error');
            break;
          }
          
          const versionsStr = parts[1].replace(/["']/g, ''); // Remove quotes
          const versions = versionsStr.split(',').map(v => v.trim());

          dispatch(setExamVersions(versions));
          addToOutput(`Set exam versions successfully: ${versions.join(', ')}`, 'success');
          break;
          
        case 'set-teleform-options':
          // Format: set-teleform-options "a),b),c),d),e)"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: set-teleform-options "a),b),c),d),e)"', 'error');
            break;
          }
          
          const optionsStr = parts[1].replace(/["']/g, ''); // Remove quotes
          const options = optionsStr.split(',').map(o => o.trim());
          
          dispatch(setTeleformOptions(options));
          addToOutput(`Set teleform options successfully: ${options.join(', ')}`, 'success');
          break;
          
        case 'shuffle-answers':
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          dispatch(shuffleAnswers());
          addToOutput('Answers shuffled successfully!', 'success');
          break;
          
        case 'selector':
          // Format: selector NAME [ARGS]
          if (parts.length < 2) {
            addToOutput('Usage: selector NAME [ARGS]', 'error');
            addToOutput('Available selectors: examState, examData, metadata, examBody, status, error, section INDEX, question-path EXAMBODY_INDEX QUESTION_INDEX, question-number NUMBER, all-questions, total-marks', 'text');
            break;
          }
          
          const selectorName = parts[1];
          const selectorArgs = parts.slice(2);
          
          runSelector(selectorName, ...selectorArgs);
          break;
          
        case 'show':
          // Format: show exam
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 2) {
            addToOutput('Usage: show exam | show section INDEX | show question INDEX', 'error');
            break;
          }
          
          const showType = parts[1].toLowerCase();
          
          if (showType === 'exam') {
            displayJSON(examState.examData);
          } else if (showType === 'section' && parts.length >= 3) {
            const idx = parseInt(parts[2]);
            const section = examState.examData.examBody[idx];
            if (!section || section.type !== 'section') {
              addToOutput('Invalid section index', 'error');
              break;
            }
            displayJSON(section);
          } else if (showType === 'question' && parts.length >= 3) {
            // Parse location index.subindex or just index
            const locationStr = parts[2];
            const locationParts = locationStr.split('.');
            
            if (locationParts.length === 1) {
              // Direct question in examBody
              const qIdx = parseInt(locationParts[0]);
              const question = examState.examData.examBody[qIdx];
              if (!question || question.type !== 'question') {
                addToOutput('Invalid question index', 'error');
                break;
              }
              displayJSON(question);
            } else if (locationParts.length === 2) {
              // Question in a section
              const secIdx = parseInt(locationParts[0]);
              const qIdx = parseInt(locationParts[1]);
              const section = examState.examData.examBody[secIdx];
              if (!section || section.type !== 'section' || !section.questions[qIdx]) {
                addToOutput('Invalid section or question index', 'error');
                break;
              }
              displayJSON(section.questions[qIdx]);
            } else {
              addToOutput('Invalid question location format', 'error');
            }
          } else {
            addToOutput('Invalid show command', 'error');
          }
          break;
          
        default:
          addToOutput(`Unknown command: ${mainCommand}. Type 'help' for available commands.`, 'error');
      }
    } catch (err) {
      addToOutput(`Error: ${err.message}`, 'error');
      console.error(err);
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
    
    // Exam creation and management
    addToOutput('\nExam Management:', 'subheading');
    addToOutput('create-exam "Title" "CourseCode" "CourseName" "Semester" Year - Create a new exam', 'text');
    addToOutput('clear-exam - Clear the current exam data', 'text');
    addToOutput('set-exam-versions "version1,version2,version3" - Set exam versions', 'text');
    addToOutput('set-teleform-options "a),b),c),d),e)" - Set teleform answer options', 'text');
    addToOutput('shuffle-answers - Shuffle answer options for all questions', 'text');
    addToOutput('update-exam-field "field" "value" - Update an exam field', 'text');
    addToOutput('update-exam-metadata "key" "value" - Update exam metadata', 'text');
    
    // Cover page and appendix
    addToOutput('\nCover Page & Appendix:', 'subheading');
    addToOutput('set-cover-page "Content" "Format" - Set exam cover page', 'text');
    addToOutput('set-appendix "Content" "Format" - Set exam appendix', 'text');
    addToOutput('remove-cover-page - Remove the cover page', 'text');
    addToOutput('remove-appendix - Remove the appendix', 'text');
    
    // Section management
    addToOutput('\nSection Management:', 'subheading');
    addToOutput('add-section "Title" "Optional Description" - Add a new section', 'text');
    addToOutput('update-section INDEX "field" "value" - Update section fields (title, description)', 'text');
    addToOutput('remove-section INDEX - Remove a section', 'text');
    
    // Question management
    addToOutput('\nQuestion Management:', 'subheading');
    addToOutput('add-question EXAMBODY_INDEX "Content" MARKS - Add a question to section or exam body', 'text');
    addToOutput('update-question EXAMBODY_INDEX QUESTION_INDEX "field" "value" - Update question fields', 'text');
    addToOutput('  Fields: content, marks, answer, correct', 'text');
    addToOutput('  For answer field use: "answer,INDEX,VALUE"', 'text');
    addToOutput('remove-question [SECTION_INDEX.]QUESTION_INDEX - Remove a question', 'text');
    
    // Question movement
    addToOutput('\nQuestion Movement:', 'subheading');
    addToOutput('move-question-to-section FROM_INDEX TO_SECTION_INDEX - Move question to a section', 'text');
    addToOutput('move-question "source.examBodyIndex[.questionsIndex]" "dest.examBodyIndex[.questionsIndex]" - Move question', 'text');
    
    // Viewing data
    addToOutput('\nViewing Data:', 'subheading');
    addToOutput('show exam - Display full exam data', 'text');
    addToOutput('show section INDEX - Display section data', 'text');
    addToOutput('show question INDEX[.SUBINDEX] - Display question data', 'text');
    
    // Selectors
    addToOutput('\nSelectors:', 'subheading');
    addToOutput('selector NAME [ARGS] - Run a selector to retrieve data', 'text');
    addToOutput('  Available selectors:', 'text');
    addToOutput('  examState - Get full exam state', 'text');
    addToOutput('  examData - Get exam data', 'text');
    addToOutput('  metadata - Get exam metadata', 'text');
    addToOutput('  examBody - Get exam body', 'text');
    addToOutput('  status - Get exam status', 'text');
    addToOutput('  error - Get exam error', 'text');
    addToOutput('  section INDEX - Get section by index', 'text');
    addToOutput('  question-path EXAMBODY_INDEX QUESTION_INDEX - Get question by path', 'text');
    addToOutput('  question-number NUMBER - Get question by number', 'text');
    addToOutput('  all-questions - Get all questions flat', 'text');
    addToOutput('  table-questions - Get all questions flat and normalised for table view', 'text');
    addToOutput('  total-marks - Get total exam marks', 'text');
  };
  

  return (
    <div style={{ backgroundColor: '#111', color: '#ddd', padding: '1em', fontFamily: 'monospace' }}>
      <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '1em' }}>
        {output.map((line, idx) => (
          <pre key={idx} style={{ color: getColor(line.type) }}>{line.text}</pre>
        ))}
        <div ref={outputEndRef} />
      </div>
      <input
        type="text"
        value={command}
        onChange={e => setCommand(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && processCommand()}
        placeholder="Enter command..."
        style={{
          width: '100%',
          padding: '0.5em',
          backgroundColor: '#222',
          color: '#fff',
          border: '1px solid #444'
        }}
      />
    </div>
  );
}

const getColor = (type) => {
  switch (type) {
    case 'error': return '#f66';
    case 'success': return '#6f6';
    case 'command': return '#6cf';
    case 'code': return '#fc6';
    default: return '#ddd';
  }
};

export default ExamConsole;
