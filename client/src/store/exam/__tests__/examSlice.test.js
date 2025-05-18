/*
    examSlice.test.js

    Tests for the exam Redux slice functionality.
    Verifies that reducers correctly handle actions and update state.
*/

import { configureStore } from '@reduxjs/toolkit';
import examReducer, {
    initializeExamState,
    clearExamState,
    addSection,
    addQuestion,
    removeQuestion,
    removeSection,
    updateQuestion,
    updateSection,
    updateExamField,
    setExamVersions,
    setTeleformOptions,
    regenerateShuffleMaps
} from '../examSlice';

import { selectExamData } from '../selectors';

// Mock document.createElement for htmlToText function
document.createElement = jest.fn(() => ({
    innerHTML: '',
    textContent: 'mocked content',
    innerText: ''
}));

describe('Exam Slice', () => {
    let store;

    // Setup fresh store before each test
    beforeEach(() => {
        store = configureStore({
            reducer: { exam: examReducer }
        });
    });

    test('should initialize with correct default state', () => {
        const state = store.getState().exam;
        expect(state.examData).toBeNull();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
    });

    test('should create a new exam with provided data', () => {
        // Act
        store.dispatch(initializeExamState({
            examTitle: 'Test Exam',
            courseCode: 'TEST101',
            courseName: 'Test Course',
            semester: 'Fall',
            year: '2025'
        }));

        // Assert
        const state = store.getState();
        const exam = selectExamData(state);

        expect(exam).not.toBeNull();
        expect(exam.type).toBe('exam');
        expect(exam.examTitle).toBe('Test Exam');
        expect(exam.courseCode).toBe('TEST101');
        expect(exam.courseName).toBe('Test Course');
        expect(exam.semester).toBe('Fall');
        expect(exam.year).toBe('2025');
        expect(Array.isArray(exam.examBody)).toBe(true);
        expect(exam.examBody.length).toBe(0);
    });

    test('should clear exam data', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        
        // Act
        store.dispatch(clearExamState());
        
        // Assert
        const state = store.getState();
        expect(state.exam.examData).toBeNull();
    });

    test('should add a section to the exam', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        
        // Act
        store.dispatch(addSection({
            sectionTitle: 'Test Section',
            contentFormatted: '<p>Section instructions</p>'
        }));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.examBody.length).toBe(1);
        expect(exam.examBody[0].type).toBe('section');
        expect(exam.examBody[0].sectionTitle).toBe('Test Section');
        expect(exam.examBody[0].contentFormatted).toBe('<p>Section instructions</p>');
        expect(exam.examBody[0].contentText).toBe('mocked content');
        expect(exam.examBody[0].sectionNumber).toBe(1);
        expect(Array.isArray(exam.examBody[0].questions)).toBe(true);
    });

    test('should add a question directly to the exam body', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        
        // Act
        store.dispatch(addQuestion({
            examBodyIndex: null,
            questionData: {
                contentFormatted: '<p>What is 2+2?</p>',
                marks: 5
            }
        }));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.examBody.length).toBe(1);
        expect(exam.examBody[0].type).toBe('question');
        expect(exam.examBody[0].contentFormatted).toBe('<p>What is 2+2?</p>');
        expect(exam.examBody[0].contentText).toBe('mocked content');
        expect(exam.examBody[0].marks).toBe(5);
        expect(exam.examBody[0].questionNumber).toBe(1);
    });

    test('should add a question to a section', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        store.dispatch(addSection({ sectionTitle: 'Test Section' }));
        
        // Act
        store.dispatch(addQuestion({
            examBodyIndex: 0,
            questionData: {
                contentFormatted: '<p>What is 2+2?</p>',
                marks: 5
            }
        }));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.examBody.length).toBe(1);
        expect(exam.examBody[0].type).toBe('section');
        expect(exam.examBody[0].questions.length).toBe(1);
        expect(exam.examBody[0].questions[0].type).toBe('question');
        expect(exam.examBody[0].questions[0].contentFormatted).toBe('<p>What is 2+2?</p>');
        expect(exam.examBody[0].questions[0].marks).toBe(5);
        expect(exam.examBody[0].questions[0].questionNumber).toBe(1);
    });

    test('should update a question', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        store.dispatch(addQuestion({
            questionData: {
                contentFormatted: '<p>Original question</p>',
                marks: 1
            }
        }));
        
        // Act
        store.dispatch(updateQuestion({
            location: { examBodyIndex: 0 },
            newData: {
                contentFormatted: '<p>Updated question</p>',
                marks: 2
            }
        }));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.examBody[0].contentFormatted).toBe('<p>Updated question</p>');
        expect(exam.examBody[0].marks).toBe(2);
    });

    test('should update a section', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        store.dispatch(addSection({
            sectionTitle: 'Original Section',
            contentFormatted: '<p>Original instructions</p>'
        }));
        
        // Act
        store.dispatch(updateSection({
            examBodyIndex: 0,
            newData: {
                sectionTitle: 'Updated Section',
                contentFormatted: '<p>Updated instructions</p>'
            }
        }));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.examBody[0].sectionTitle).toBe('Updated Section');
        expect(exam.examBody[0].contentFormatted).toBe('<p>Updated instructions</p>');
    });

    test('should remove a question', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        store.dispatch(addQuestion({
            questionData: { contentFormatted: '<p>Question 1</p>' }
        }));
        store.dispatch(addQuestion({
            questionData: { contentFormatted: '<p>Question 2</p>' }
        }));
        
        // Act
        store.dispatch(removeQuestion({ examBodyIndex: 0 }));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.examBody.length).toBe(1);
        expect(exam.examBody[0].contentFormatted).toBe('<p>Question 2</p>');
        expect(exam.examBody[0].questionNumber).toBe(1); // Should be renumbered
    });

    test('should remove a section', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        store.dispatch(addSection({ sectionTitle: 'Section 1' }));
        store.dispatch(addSection({ sectionTitle: 'Section 2' }));
        
        // Act
        store.dispatch(removeSection(0));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.examBody.length).toBe(1);
        expect(exam.examBody[0].sectionTitle).toBe('Section 2');
        expect(exam.examBody[0].sectionNumber).toBe(1); // Should be renumbered
    });

    test('should update exam field', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        
        // Act
        store.dispatch(updateExamField({
            field: 'examTitle',
            value: 'Updated Exam Title'
        }));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.examTitle).toBe('Updated Exam Title');
    });

    test('should set exam versions', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        
        // Act
        store.dispatch(setExamVersions(['A', 'B', 'C']));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.versions).toEqual(['A', 'B', 'C']);
    });

    test('should set teleform options', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        
        // Act
        store.dispatch(setTeleformOptions(['i', 'ii', 'iii']));
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        
        expect(exam.teleformOptions).toEqual(['i', 'ii', 'iii']);
    });

    test('should regenerate shuffle maps', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        store.dispatch(addQuestion({
            questionData: {
                contentFormatted: '<p>Test question</p>',
                answers: [
                    { contentFormatted: '<p>Answer 1</p>' },
                    { contentFormatted: '<p>Answer 2</p>' },
                    { contentFormatted: '<p>Answer 3</p>' },
                    { contentFormatted: '<p>Answer 4</p>' },
                    { contentFormatted: '<p>Answer 5</p>' }
                ]
            }
        }));
        
        // Act
        store.dispatch(regenerateShuffleMaps());
        
        // Assert
        const state = store.getState();
        const exam = selectExamData(state);
        const question = exam.examBody[0];
        
        expect(Array.isArray(question.answerShuffleMaps)).toBe(true);
        expect(question.answerShuffleMaps.length).toBe(exam.versions.length);
        
        // Each shuffle map should be a permutation of indices
        question.answerShuffleMaps.forEach(map => {
            expect(Array.isArray(map)).toBe(true);
            expect(map.length).toBe(question.answers.length);
            
            // Should contain all indices from 0 to length-1
            const sortedMap = [...map].sort((a, b) => a - b);
            for (let i = 0; i < sortedMap.length; i++) {
                expect(sortedMap[i]).toBe(i);
            }
        });
    });

    test('should preserve IDs when importing from JSON', () => {
        // Arrange
        store.dispatch(initializeExamState({ examTitle: 'Test Exam' }));
        
        // Add a question and capture its ID
        store.dispatch(addQuestion({
            examBodyIndex: null,
            questionData: {
                contentFormatted: '<p>Test Question</p>',
                marks: 5
            }
        }));
        
        const originalExam = selectExamData(store.getState());
        const originalQuestionId = originalExam.examBody[0].id;
        console.log('Original ID:', originalQuestionId);
        
        // Convert to JSON and back
        const examJSON = JSON.parse(JSON.stringify(originalExam));
        store.dispatch(clearExamState());
        store.dispatch(initializeExamState(examJSON)); // uses initializeExamState to import from JSON
        
        // Check the new ID
        const importedExam = selectExamData(store.getState());
        const importedQuestionId = importedExam.examBody[0].id;
        console.log('Imported ID:', importedQuestionId);
        
        // They should match
        expect(importedQuestionId).toBe(originalQuestionId);
    });

    test('should correctly import exam from JSON', () => {
        // Arrange
        // First create an exam with some content
        store.dispatch(initializeExamState({
            examTitle: 'Original Exam',
            courseCode: 'TEST101',
            courseName: 'Test Course',
            semester: 'Fall',
            year: '2025'
        }));
    
        // Add a section with a question
        store.dispatch(addSection({
            sectionTitle: 'Test Section',
            contentFormatted: '<p>Section Content</p>'
        }));
    
        store.dispatch(addQuestion({
            examBodyIndex: 0,
            questionData: {
                contentFormatted: '<p>Test Question</p>',
                marks: 5,
                answers: [
                    { contentFormatted: '<p>Answer 1</p>', correct: true },
                    { contentFormatted: '<p>Answer 2</p>', correct: false }
                ]
            }
        }));
    
        // Get the current state and convert to JSON
        const originalExam = selectExamData(store.getState());
        console.log(`JSON test, Original ID: ${JSON.stringify(originalExam.examBody[0].questions[0].id)}`);
        const examJSON = JSON.parse(JSON.stringify(originalExam));
    
        // Clear the exam to ensure we're starting fresh
        store.dispatch(clearExamState());
    
        // Act (uses initializeExamState to import from JSON) 
        store.dispatch(initializeExamState(examJSON));
    
        // Assert
        const importedExam = selectExamData(store.getState());
        console.log(`JSON test, imported ID: ${JSON.stringify(importedExam.examBody[0].questions[0].id)}`);
        // Check that the imported exam matches the original
        expect(importedExam).toEqual(originalExam);
        
        // Verify specific properties to ensure nothing was lost in translation
        expect(importedExam.examTitle).toBe('Original Exam');
        expect(importedExam.courseCode).toBe('TEST101');
        expect(importedExam.examBody.length).toBe(1);
        expect(importedExam.examBody[0].type).toBe('section');
        expect(importedExam.examBody[0].questions.length).toBe(1);
        expect(importedExam.examBody[0].questions[0].marks).toBe(5);
        expect(importedExam.examBody[0].questions[0].answers.length).toBe(importedExam.teleformOptions.length);
    });
});