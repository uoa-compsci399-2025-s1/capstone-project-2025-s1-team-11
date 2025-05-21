//ExamConsole.jsx
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  initialiseExamState,
  clearExamState,
  addSection,
  addQuestion,
  removeCoverPage,
  removeAppendix,
  updateQuestion, 
  updateSection,
  moveQuestion,
  moveSection,
  removeQuestion,
  removeSection,
  updateExamField,
  setExamVersions,
  setTeleformOptions,
  regenerateShuffleMaps,
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

import {
  createAnswer,
} from '../store/exam/examUtils';

// Completion metadata
const ACTION_METADATA = {
  removeQuestion: {
    name: 'removeQuestion',
    parameters: [{
      name: 'examBodyIndex',
      type: 'number',
      isRequired: true,
      description: 'Index in examBody array'
    }, {
      name: 'questionsIndex',
      type: 'number',
      isRequired: false,
      description: 'Index in section questions array (if removing from section)'
    }],
    description: 'Remove a question from the exam or section'
  },
  addSection: {
    name: 'addSection',
    parameters: [{
      name: 'sectionTitle',
      type: 'string',
      isRequired: true,
      description: 'Title of the section'
    }, {
      name: 'contentText',
      type: 'string',
      isRequired: false,
      description: 'Description or content text'
    }],
    description: 'Add a new section to the exam'
  },
  // Add metadata for other actions...
};

const SELECTOR_METADATA = {
  selectSectionByIndex: {
    name: 'selectSectionByIndex',
    parameters: [{
      name: 'index',
      type: 'number',
      isRequired: true,
      description: 'Index of the section in examBody'
    }],
    description: 'Get a section by its index'
  },
  selectQuestionByPath: {
    name: 'selectQuestionByPath',
    parameters: [{
      name: 'examBodyIndex',
      type: 'number',
      isRequired: true,
      description: 'Index in examBody array'
    }, {
      name: 'questionIndex',
      type: 'number',
      isRequired: true,
      description: 'Index of question in section'
    }],
    description: 'Get a question by its path'
  },
  // Add metadata for other selectors...
};

function ExamConsole() {
  const dispatch = useDispatch();
  const examState = useSelector(selectExamState);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [completionContext, setCompletionContext] = useState(null);
  const outputEndRef = useRef(null);
  const inputRef = useRef(null);

  // Track cursor position for completion
  const [cursorPosition, setCursorPosition] = useState(0);

  // Update cursor position on selection change
  const handleSelectionChange = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
  };

  // Get completion context at current cursor position
  const getCompletionContext = (text, position) => {
    const beforeCursor = text.substring(0, position);
    
    // Check for dispatch context
    const dispatchMatch = beforeCursor.match(/dispatch\(([\w\d]*)?$/);
    if (dispatchMatch) {
      return {
        type: 'action',
        partial: dispatchMatch[1] || '',
        startPos: position - (dispatchMatch[1] || '').length
      };
    }

    // Check for selector context
    const selectorMatch = beforeCursor.match(/useSelector\(([\w\d]*)?$/);
    if (selectorMatch) {
      return {
        type: 'selector',
        partial: selectorMatch[1] || '',
        startPos: position - (selectorMatch[1] || '').length
      };
    }

    // Check for parameter context
    const paramMatch = beforeCursor.match(/[\w\d]+\(([^)]*)?$/);
    if (paramMatch) {
      const actionOrSelector = beforeCursor.match(/[\w\d]+(?=\()/)?.[0];
      return {
        type: 'parameter',
        action: actionOrSelector,
        partial: paramMatch[1] || '',
        startPos: position - (paramMatch[1] || '').length
      };
    }

    return null;
  };

  // Update suggestions based on completion context
  const updateSuggestions = (context) => {
    if (!context) {
      setSuggestions([]);
      return;
    }

    let newSuggestions = [];
    const partial = context.partial.toLowerCase();

    switch (context.type) {
      case 'action':
        newSuggestions = Object.values(ACTION_METADATA)
          .filter(action => action.name.toLowerCase().includes(partial))
          .map(action => ({
            text: action.name,
            description: action.description,
            type: 'action'
          }));
        break;

      case 'selector':
        newSuggestions = Object.values(SELECTOR_METADATA)
          .filter(selector => selector.name.toLowerCase().includes(partial))
          .map(selector => ({
            text: selector.name,
            description: selector.description,
            type: 'selector'
          }));
        break;

      case 'parameter': {
        const metadata = context.action && (
          ACTION_METADATA[context.action] || 
          SELECTOR_METADATA[context.action]
        );
        if (metadata) {
          const params = metadata.parameters;
          const paramParts = context.partial.split(',').map(p => p.trim());
          const currentParamIndex = paramParts.length - 1;
          
          if (currentParamIndex < params.length) {
            const param = params[currentParamIndex];
            const currentValue = paramParts[currentParamIndex] || '';
            
            if (param.type === 'object' && (!currentValue || currentValue === '{')) {
              newSuggestions = [{
                text: `{ ${param.name}: ${param.type} }`,
                description: param.description,
                type: 'parameter'
              }];
            } else {
              newSuggestions = [{
                text: param.name,
                description: `${param.description} (${param.type})`,
                type: 'parameter'
              }];
            }
          }
        }
        break;
      }
      default:
        break;
    }

    setSuggestions(newSuggestions);
    setSelectedSuggestion(0);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setCommand(newValue);
    
    const context = getCompletionContext(newValue, e.target.selectionStart);
    setCompletionContext(context);
    updateSuggestions(context);
  };

  // Handle keyboard navigation of suggestions
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') {
        processCommand();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion((prev) => 
          (prev + 1) % suggestions.length
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion((prev) => 
          (prev - 1 + suggestions.length) % suggestions.length
        );
        break;

      case 'Tab':
      case 'Enter':
        if (suggestions.length > 0) {
          e.preventDefault();
          applySuggestion(suggestions[selectedSuggestion]);
        } else if (e.key === 'Enter') {
          processCommand();
        }
        break;

      case 'Escape':
        setSuggestions([]);
        break;
    }
  };

  // Apply selected suggestion
  const applySuggestion = (suggestion) => {
    if (!completionContext || !suggestion) return;

    const before = command.substring(0, completionContext.startPos);
    const after = command.substring(cursorPosition);
    
    let insertion = suggestion.text;
    if (suggestion.type === 'action' || suggestion.type === 'selector') {
      insertion += '(';
    }

    setCommand(before + insertion + after);
    setSuggestions([]);
    
    // Focus and move cursor
    if (inputRef.current) {
      const newCursorPos = before.length + insertion.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }
  };
  
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
  
  // Add runSelector function before processCommand
  const runSelector = (selectorName, ...args) => {
    try {
      const selector = {
        examState: selectExamState,
        examData: selectExamData,
        metadata: selectExamMetadata,
        examBody: selectExamBody,
        status: selectExamStatus,
        error: selectExamError,
        'section': selectSectionByIndex,
        'question-path': selectQuestionByPath,
        'question-number': selectQuestionByNumber,
        'all-questions': selectAllQuestionsFlat,
        'table-questions': selectQuestionsForTable,
        'total-marks': selectTotalMarks
      }[selectorName];

      if (!selector) {
        addToOutput(`Unknown selector: ${selectorName}`, 'error');
        return;
      }

      const state = { exam: examState };
      const result = args.length > 0 ? selector(state, ...args.map(arg => {
        const num = Number(arg);
        return isNaN(num) ? arg : num;
      })) : selector(state);
      
      displayJSON(result);
    } catch (err) {
      addToOutput(`Error running selector: ${err.message}`, 'error');
    }
  };
  
  // Process commands
  const processCommand = () => {
    const trimmedCommand = command.trim();
    addToOutput(`> ${trimmedCommand}`, 'command');
    
    // Check for function-call style syntax first
    const dispatchMatch = trimmedCommand.match(/dispatch\((.*?)\((.*)\)\)/);
    const selectorMatch = trimmedCommand.match(/useSelector\((.*?)\)/);
    
    if (dispatchMatch) {
      // Parse dispatch(actionCreator(payload))
      const actionName = dispatchMatch[1];
      let payload = {};
      
      try {
        // Parse payload if provided
        if (dispatchMatch[2]) {
          payload = JSON.parse(dispatchMatch[2]);
        }
        
        // Get action creator from imported actions
        const actionCreator = {
          initialiseExamState,
          clearExamState,
          addSection,
          addQuestion,
          removeCoverPage,
          removeAppendix,
          updateQuestion,
          updateSection,
          moveQuestion,
          moveSection,
          removeQuestion,
          removeSection,
          updateExamField,
          setExamVersions,
          setTeleformOptions,
          regenerateShuffleMaps,
          setCoverPage,
          setAppendix
        }[actionName];

        if (!actionCreator) {
          addToOutput(`Unknown action creator: ${actionName}`, 'error');
          return;
        }

        dispatch(actionCreator(payload));
        addToOutput(`Action ${actionName} dispatched successfully!`, 'success');
      } catch (err) {
        addToOutput(`Error dispatching action: ${err.message}`, 'error');
      }
      
      setCommand('');
      return;
    }
    
    if (selectorMatch) {
      // Parse useSelector(selectorName) or useSelector(selectorName(args))
      const selectorStr = selectorMatch[1];
      
      try {
        // Check if this is a parameterized selector call
        const paramMatch = selectorStr.match(/(.*?)\((.*)\)/);
        const selectorName = paramMatch ? paramMatch[1] : selectorStr;
        let selectorArgs = [];

        if (paramMatch && paramMatch[2]) {
          // Parse arguments - handle both JSON and simple numbers
          selectorArgs = paramMatch[2].split(',').map(arg => {
            arg = arg.trim();
            try {
              // Try parsing as JSON first
              return JSON.parse(arg);
            } catch {
              // If not valid JSON, try parsing as number, otherwise keep as string
              const num = Number(arg);
              return isNaN(num) ? arg : num;
            }
          });
        }

        // Run selector
        runSelector(selectorName, ...selectorArgs);
      } catch (err) {
        addToOutput(`Error running selector: ${err.message}`, 'error');
      }
      
      setCommand('');
      return;
    }
    
    // Split command into parts for traditional command processing
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
          
        case 'create-exam': {
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
          
          dispatch(initialiseExamState({
            examTitle: examArgs[1],
            courseCode: examArgs[2],
            courseName: examArgs[3],
            semester: examArgs[4],
            year: parseInt(examArgs[5]) || new Date().getFullYear()
          }));
          
          addToOutput('Exam created successfully!', 'success');
          break;
        }

        case 'clear-exam': {
          dispatch(clearExamState());
          addToOutput('Exam cleared successfully!', 'success');
          break;
        }

        case 'add-section': {
          // Format: add-section "Section Title" "Content Text"
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
            sectionTitle: sectionArgs[1] || 'New Section',
            contentText: sectionArgs[2] || ''
          }));
          
          addToOutput('Section added successfully!', 'success');
          break;
        }

        case 'add-question': {
          // Format: add-question "Question content" MARKS EXAMBODY_INDEX 
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
          const marks = parseFloat(questionArgs[2]) || 1;

          const payload = {
            questionData: {
              contentText: questionContent,
              marks,
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
        }

        case 'set-cover-page': {
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
        }

        case 'set-appendix': {
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
        }

        case 'remove-cover-page': {
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          dispatch(removeCoverPage());
          addToOutput('Cover page removed successfully!', 'success');
          break;
        }

        case 'remove-appendix': {
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          dispatch(removeAppendix());
          addToOutput('Appendix removed successfully!', 'success');
          break;
        }

        case 'update-question': {
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
        
          const location = { examBodyIndex: exBodyIdx };
          const exBodyItem = examState.examData.examBody[exBodyIdx];
          if (!exBodyItem) {
            addToOutput('Invalid examBody index', 'error');
            break;
          }
        
          if (exBodyItem.type === 'section') location.questionsIndex = qIdx;
          const currentQuestion = exBodyItem.type === 'section'
            ? exBodyItem.questions[qIdx]
            : exBodyItem;
          //console.log(`location: ${JSON.stringify(location)}`)
        
          if (!currentQuestion) {
            addToOutput('Invalid question index', 'error');
            break;
          }
        
          const qUpdateData = {};
        
          switch (qField) {
            case 'contenttext':
              qUpdateData.contentText = qValue;
              break;
            case 'contentformatted':
              qUpdateData.content = qValue;
              break;
            case 'questionumber':
              qUpdateData.questionNumber = parseInt(qValue) || null;
              break;
            case 'marks':
              qUpdateData.marks = parseInt(qValue) || null;
              break;
            case 'format':
            case 'type':
            case 'pagebreakafter':
              qUpdateData[qField] = qValue;
              break;
            case 'answer': {
              // Format: "INDEX,contentText"
              const ansParts = qValue.split(',');
              if (ansParts.length < 2) {
                addToOutput('For answer field, use format: "INDEX,Text"', 'error');
                break;
              }
              const ansIdx = parseInt(ansParts[0]);
              const ansContent = ansParts.slice(1).join(',').trim();
              qUpdateData.answers = [...(currentQuestion.answers || [])];
        
              while (qUpdateData.answers.length <= ansIdx) {
                qUpdateData.answers.push(createAnswer({}));
              }
        
              qUpdateData.answers[ansIdx] = {
                ...qUpdateData.answers[ansIdx],
                contentText: ansContent,
              };
              break;
            }
            case 'answers': {
              // Format: "text1|text2|text3"
              qUpdateData.answers = qValue.split('|').map((text, i) => ({
                ...(currentQuestion.answers?.[i] || createAnswer({})),
                contentText: text.trim(),
              }));
              break;
            }
            case 'correctanswer': {
              // Format: "INDEX"
              const correctIndex = parseInt(qValue);
              qUpdateData.answers = (currentQuestion.answers || []).map((a, i) => ({
                ...a,
                correct: i === correctIndex,
              }));
              break;
            }
            case 'correctanswers': {
              // Format: "1,0,0,1"
              try {
                const correctFlags = qValue.split(',').map(v => parseInt(v.trim()) === 1);
                qUpdateData.answers = (currentQuestion.answers || []).map((a, i) => ({
                  ...a,
                  correct: correctFlags[i] || false,
                }));
              } catch {
                addToOutput('Invalid format for correctanswers', 'error');
                break;
              }
              break;
            }
            case 'fixedposition': {
              // Format: "INDEX,POSITION"
              const lockSplit = qValue.split(',');
              if (lockSplit.length < 2) {
                addToOutput('Use format: "fixedposition,INDEX,POSITION"', 'error');
                break;
              }
              const lockIndex = parseInt(lockSplit[0]);
              const fixedPos = parseInt(lockSplit[1]);
              qUpdateData.answers = [...(currentQuestion.answers || [])];
        
              while (qUpdateData.answers.length <= lockIndex) {
                qUpdateData.answers.push(createAnswer({}));
              }
        
              qUpdateData.answers[lockIndex] = {
                ...qUpdateData.answers[lockIndex],
                fixedPosition: isNaN(fixedPos) ? null : fixedPos,
              };
              break;
            }
            default:
              addToOutput(`Unknown question field: ${qField}`, 'error');
              return;
          }
        
          dispatch(updateQuestion({ location, newData: qUpdateData }));
          addToOutput(`Updated question ${qField} successfully!`, 'success');
          break;
        }

        case 'update-section': {
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
          const secField = updateSectionArgs[2];
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
            case 'sectionTitle':
              secUpdateData.sectionTitle = secValue;
              break;
            case 'contentText':
              secUpdateData.contentText = secValue;
              break;
            default:
              addToOutput(`Unknown section field: ${secField}`, 'error');
              return;
          }
          
          dispatch(updateSection({ examBodyIndex: secIdx, newData: secUpdateData }));
          addToOutput(`Updated section ${secField} successfully!`, 'success');
          break;
        }

        case 'move-question': {
          // Format: move-question "<source examBodyIndex>.<questionsIndex (optional)>" "<destination examBodyIndex>.<questionsIndex (optional)>"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 3) {
            addToOutput('Usage: move-question "source <examBodyIndex>.<questionsIndex (optional)>" "destination <examBodyIndex>.<questionsIndex (optional)>"', 'error');
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
        }

        case 'move-section': {
          // Format: move-question "<source examBodyIndex>" "<destination examBodyIndex>"
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          if (parts.length < 3) {
            addToOutput('Usage: move-section "<source examBodyIndex>" "<destination examBodyIndex>"', 'error');
            addToOutput('Example: move-section "0" "1" (moves section at examBody[0] to index 1)', 'text');
            break;
          }
          
          // Parse source and destination
          const sourceIndex = parseInt(parts[1]);
          const destIndex = parseInt(parts[2]);
          
          // Validate source and destination
          if (isNaN(sourceIndex) || sourceIndex < 0 || 
          sourceIndex >= examState.examData.examBody.length) {
            addToOutput('Invalid source examBody index', 'error');
            break;
          }
          
          if (isNaN(destIndex) || destIndex < 0 || 
          destIndex >= examState.examData.examBody.length) {
            addToOutput('Invalid destination examBody index', 'error');
            break;
          }

          dispatch(moveSection({ sourceIndex, destIndex }));
          addToOutput('Section moved sucessfully!', 'success');
          break;
        }

        case 'remove-section': {
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
        }

        case 'remove-question': {
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
          location2.examBodyIndex = parseInt(locationParts[0]);
          
          if (locationParts.length > 1) {
            location2.questionsIndex = parseInt(locationParts[1]);
          }
          
          dispatch(removeQuestion(location2));
          addToOutput('Question removed successfully!', 'success');
          break;
        }

        case 'updateExamField': {
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
        }

        case 'shuffle-answers': {
          if (!examState.examData) {
            addToOutput('No exam is currently loaded. Create an exam first.', 'error');
            break;
          }
          
          dispatch(regenerateShuffleMaps());
          addToOutput('Answers shuffled successfully!', 'success');
          break;
        }

        case 'selector': {
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
        }

        case 'show': {
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
              const idx = parseInt(locationParts[0]);
              const item = examState.examData.examBody[idx];
              if (!item) {
                addToOutput('Invalid examBody index', 'error');
                break;
              }
              displayJSON(item);
            } else {
              const secIdx = parseInt(locationParts[0]);
              const qIdx = parseInt(locationParts[1]);
              const section = examState.examData.examBody[secIdx];
              if (!section || section.type !== 'section') {
                addToOutput('Invalid section index', 'error');
                break;
              }
              const question = section.questions[qIdx];
              if (!question) {
                addToOutput('Invalid question index', 'error');
                break;
              }
              displayJSON(question);
            }
          } else {
            addToOutput('Invalid show command', 'error');
          }
          break;
        }

        default: {
          addToOutput(`Unknown command: ${mainCommand}. Type 'help' for available commands.`, 'error');
          break;
        }
      }
    } catch (err) {
      addToOutput(`Error: ${err.message}`, 'error');
      console.error(err);
    }
    
    // Clear command input
    setCommand('');
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
    
    // Redux Style Commands
    addToOutput('\nRedux-Style Commands:', 'subheading');
    addToOutput('dispatch(actionCreator(payload)) - Dispatch a Redux action directly', 'text');
    addToOutput('  Example: dispatch(removeQuestion({"examBodyIndex": 1, "questionsIndex": 0}))', 'text');
    addToOutput('  Example: dispatch(addSection({"sectionTitle": "New Section", "contentText": "Description"}))', 'text');
    addToOutput('  Available actions: initialiseExamState, clearExamState, addSection, addQuestion, removeCoverPage,', 'text');
    addToOutput('    removeAppendix, updateQuestion, updateSection, moveQuestion, moveSection, removeQuestion,', 'text');
    addToOutput('    removeSection, updateExamField, setExamVersions, setTeleformOptions, regenerateShuffleMaps,', 'text');
    addToOutput('    setCoverPage, setAppendix', 'text');

    addToOutput('\nuseSelector(selectorName) - Get state using a Redux selector', 'text');
    addToOutput('  Example: useSelector(selectExamData)', 'text');
    addToOutput('  Example: useSelector(selectTotalMarks)', 'text');
    addToOutput('  Example with parameters: useSelector(selectSectionByIndex(1))', 'text');
    addToOutput('  Example with multiple parameters: useSelector(selectQuestionByPath(0, 1))', 'text');
    addToOutput('  Example with JSON: useSelector(selectQuestionByPath({"examBodyIndex": 0, "questionsIndex": 1}))', 'text');
    addToOutput('  Available selectors:', 'text');
    addToOutput('    No parameters: selectExamState, selectExamData, selectExamMetadata, selectExamBody,', 'text');
    addToOutput('      selectExamStatus, selectExamError, selectAllQuestionsFlat, selectQuestionsForTable,', 'text');
    addToOutput('      selectTotalMarks', 'text');
    addToOutput('    With parameters:', 'text');
    addToOutput('      selectSectionByIndex(index: number)', 'text');
    addToOutput('      selectQuestionByPath(examBodyIndex: number, questionIndex: number)', 'text');
    addToOutput('      selectQuestionByNumber(questionNumber: number)', 'text');
    
    // Traditional Commands
    addToOutput('\nTraditional Commands:', 'subheading');
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
    addToOutput('move-section: move-section "<source examBodyIndex>" "<destination examBodyIndex>"', 'text');
    addToOutput('remove-section INDEX - Remove a section', 'text');
    
    // Question management
    addToOutput('\nQuestion Management:', 'subheading');
    addToOutput('add-question "Content" MARKS EXAMBODY_INDEX - Add a question to section or exam depending on optional index', 'text');
    addToOutput('update-question EXAMBODY_INDEX QUESTION_INDEX "field" "value" - Update question fields', 'text');
    addToOutput('  Fields: content, marks, answer, correct', 'text');
    addToOutput('  For answer field use: "answer,INDEX,VALUE"', 'text');
    addToOutput('move-question "source.examBodyIndex[.questionsIndex]" "dest.examBodyIndex[.questionsIndex]" - Move question', 'text');
    addToOutput('remove-question [SECTION_INDEX.]QUESTION_INDEX - Remove a question', 'text');
    
    // Question movement
    // addToOutput('\nQuestion Movement:', 'subheading');
    // addToOutput('move-question-to-section FROM_INDEX TO_SECTION_INDEX - Move question to a section', 'text');

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
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={command}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelectionChange}
          placeholder="Enter command..."
          style={{
            width: '100%',
            padding: '0.5em',
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #444',
            fontFamily: 'monospace'
          }}
          ref={inputRef}
        />
        {
        suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#1a1a1a',
            border: '1px solid #444',
            borderTop: 'none',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.text}
                style={{
                  padding: '0.5em',
                  cursor: 'pointer',
                  backgroundColor: index === selectedSuggestion ? '#2a2a2a' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => applySuggestion(suggestion)}
                onMouseEnter={() => setSelectedSuggestion(index)}
              >
                <span style={{ color: getTypeColor(suggestion.type) }}>
                  {suggestion.text}
                </span>
                {suggestion.description && (
                  <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '1em' }}>
                    {suggestion.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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

const getTypeColor = (type) => {
  switch (type) {
    case 'action': return '#6cf';
    case 'selector': return '#fc6';
    case 'parameter': return '#6f6';
    default: return '#ddd';
  }
};


export default ExamConsole;
