import { configureStore } from '@reduxjs/toolkit';
import examReducer, { initialiseExamState, addQuestion, importMarkingKey } from '../../store/exam/examSlice';
import { selectExamData, selectAllQuestionsFlat, selectCorrectAnswerIndices } from '../../store/exam/selectors';
import fs from 'fs';
import path from 'path';
import { parseMarkingKeyCSV, processMarkingKeyFile } from '../../services/markingKeyImportService';

// Mock file system for tests
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

describe('Marking Key Import Integration', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        exam: examReducer,
      },
    });
    
    // Initialize a basic exam structure
    store.dispatch(initialiseExamState({
      examTitle: 'Test Exam',
      courseCode: 'TEST101',
      versions: ['1', '2', '3', '4'],
      teleformOptions: ['A', 'B', 'C', 'D', 'E']
    }));
    
    // Add test questions
    store.dispatch(addQuestion({
      questionData: {
        contentFormatted: '<p>Question 1</p>',
        questionNumber: 1,
        marks: 1,
        answers: [
          { contentFormatted: '<p>Answer 1</p>' },
          { contentFormatted: '<p>Answer 2</p>' },
          { contentFormatted: '<p>Answer 3</p>' },
          { contentFormatted: '<p>Answer 4</p>' },
          { contentFormatted: '<p>Answer 5</p>' }
        ]
      }
    }));
    
    store.dispatch(addQuestion({
      questionData: {
        contentFormatted: '<p>Question 2</p>',
        questionNumber: 2,
        marks: 1,
        answers: [
          { contentFormatted: '<p>Answer 1</p>' },
          { contentFormatted: '<p>Answer 2</p>' },
          { contentFormatted: '<p>Answer 3</p>' },
          { contentFormatted: '<p>Answer 4</p>' },
          { contentFormatted: '<p>Answer 5</p>' }
        ]
      }
    }));
  });
  
  test('should import marking key and update exam state correctly', async () => {
    // Mock CSV content
    const csvContent = `VersionID,QuestionID,MarkWeight,OptionSequences,Answer
1,1,2.5,10423,2
1,2,2.5,03412,1
2,1,2.5,02134,1
2,2,2.5,14032,4
3,1,2.5,42031,4
3,2,2.5,24310,16
4,1,2.5,43120,16
4,2,2.5,21043,4`;
    
    // Parse the mock CSV
    const parsedData = parseMarkingKeyCSV(csvContent);
    
    // Create simulated processed data (normally from processMarkingKeyFile)
    const versions = parsedData.versions;
    const questionMappings = {};
    const markWeights = {};
    
    // Process each question in the parsed data
    Object.entries(parsedData.questionData).forEach(([questionNumber, data]) => {
      markWeights[questionNumber] = data.markWeight;
      questionMappings[questionNumber] = {};
      
      // For each version of this question
      Object.entries(data.versions).forEach(([versionId, versionData]) => {
        // Convert the option sequence to a shuffle map
        const sequence = versionData.optionSequence.split('').map(c => parseInt(c, 10));
        
        // Create a proper shuffle map (originalIndex → newIndex)
        const shuffleMap = new Array(sequence.length).fill(0);
        for (let newIndex = 0; newIndex < sequence.length; newIndex++) {
          const originalIndex = sequence[newIndex];
          shuffleMap[originalIndex] = newIndex;
        }
        
        // Calculate correct answer indices from the answer bitmask
        // e.g., 2 = 2^1 = answer at index 1 is correct
        const correctAnswerIndices = [];
        for (let i = 0; i < sequence.length; i++) {
          const bitValue = 1 << i;
          if ((versionData.answer & bitValue) !== 0) {
            correctAnswerIndices.push(i);
          }
        }
        
        // Store the mapping data
        questionMappings[questionNumber][versionId] = {
          shuffleMap,
          correctAnswerIndices
        };
      });
    });
    
    // Dispatch the action to import the marking key
    store.dispatch(importMarkingKey({ 
      versions,
      questionMappings,
      markWeights
    }));
    
    // Get the updated exam state
    const examData = selectExamData(store.getState());
    const questions = selectAllQuestionsFlat(store.getState());
    
    // Verify versions
    expect(examData.versions).toEqual(['1', '2', '3', '4']);
    
    // Verify question marks
    expect(questions[0].marks).toBe(2.5);
    expect(questions[1].marks).toBe(2.5);
    
    // Verify shuffle maps for question 1
    const q1 = questions[0];
    expect(q1.answerShuffleMaps.length).toBe(4); // 4 versions
    
    // Check the shuffle map for version 1, question 1
    // Original sequence "10423" means: 
    // Position 0 contains 1, position 1 contains 0, etc.
    // So original index 0 goes to position 1, original index 1 goes to position 0, etc.
    expect(q1.answerShuffleMaps[0]).toEqual([1, 0, 3, 4, 2]);
    
    // Check the shuffle map for version 2, question 1
    // Original sequence "02134" means:
    // Position 0 contains 0, position 1 contains 2, etc.
    // So original index 0 goes to position 0, original index 1 goes to position 2, etc.
    expect(q1.answerShuffleMaps[1]).toEqual([0, 2, 1, 3, 4]);
    
    // Verify correct answers
    // For question 1, answer bitmask is 2 for version 1, meaning position 1 is correct
    // Since the shuffle map is [1, 0, 3, 4, 2], original index 0 maps to position 1
    // So the original answer at index 0 should be correct (since shuffleMap[0] = 1 which is in correctAnswerIndices)
    expect(q1.answers[0].correct).toBe(true);
    expect(q1.answers[1].correct).toBe(false);
    expect(q1.answers[2].correct).toBe(false);
    
    // Check correct answer indices for all versions
    const correctIndices = selectCorrectAnswerIndices(store.getState());
    
    // Version 1: Q1 has answer bitmask 2 (position 1), Q2 has answer bitmask 1 (position 0)
    expect(correctIndices['1'][1]).toEqual([1]);
    expect(correctIndices['1'][2]).toEqual([0]);
    
    // Version 2: Q1 has answer bitmask 1 (position 0), Q2 has answer bitmask 4 (position 2)
    expect(correctIndices['2'][1]).toEqual([0]);
    expect(correctIndices['2'][2]).toEqual([2]);
  });
  
  test('should handle real marking key sample data', async () => {
    // Use fs.readFileSync to read the sample file (mocked)
    const samplePath = path.join('client', 'src', 'testing', 'data', 'marking_key_sample_111.csv');
    const sampleCSV = `VersionID,QuestionID,MarkWeight,OptionSequences,Answer
1,1,2.5,10423,2
1,2,2.5,03412,1
1,3,2.5,24301,8
1,4,2.5,10342,2`;
    
    fs.readFileSync.mockReturnValue(sampleCSV);
    
    // Mock File object and text() method
    const mockFile = {
      text: jest.fn().mockResolvedValue(sampleCSV)
    };
    
    // Process the mock file
    const markingKeyData = await processMarkingKeyFile(mockFile);
    
    // Import the marking key
    store.dispatch(importMarkingKey(markingKeyData));
    
    // Get the updated exam state
    const questions = selectAllQuestionsFlat(store.getState());
    
    // Verify the first question
    const q1 = questions[0];
    expect(q1.marks).toBe(2.5);
    expect(q1.answerShuffleMaps[0]).toEqual([1, 0, 3, 4, 2]);
    
    // For version 1, question 1, the Answer is 2, which means position 1 is correct
    // Since the shuffle map is [1, 0, 3, 4, 2], original index 0 maps to position 1
    // So the original answer at index 0 should be correct
    expect(q1.answers[0].correct).toBe(true);
  });
}); 