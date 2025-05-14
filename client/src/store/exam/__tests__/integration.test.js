/*
    integration.test.js

    Integration tests for the exam store.
    Tests how different parts of the exam store work together.
*/

import { configureStore } from '@reduxjs/toolkit';
import examReducer, {
    createNewExam,
    addSection,
    addQuestion,
    updateQuestion,
    updateSection,
    removeQuestion,
    regenerateShuffleMaps
} from '../examSlice';

import {
    selectExamData,
    selectAllQuestionsFlat,
    selectTotalMarks,
    selectQuestionByNumber
} from '../selectors';

// Mock document.createElement for htmlToText function
document.createElement = jest.fn(() => ({
    innerHTML: '',
    textContent: 'mocked content',
    innerText: ''
}));

describe('Exam Store Integration', () => {
    let store;

    beforeEach(() => {
        store = configureStore({
            reducer: { exam: examReducer }
        });
    });

    test('should build a complete exam structure and calculate derived data', () => {
        // Create an exam
        store.dispatch(createNewExam({
            examTitle: 'Integration Test Exam',
            courseCode: 'INT101',
            courseName: 'Integration Testing',
            semester: 'Fall',
            year: '2025'
        }));

        // Add a section
        store.dispatch(addSection({
            sectionTitle: 'Section 1: Basics',
            contentFormatted: '<p>Answer all questions in this section.</p>'
        }));

        // Add questions to the section
        store.dispatch(addQuestion({
            examBodyIndex: 0,
            questionData: {
                contentFormatted: '<p>What is integration testing?</p>',
                marks: 2,
                answers: [
                    { contentFormatted: '<p>Testing individual units</p>', correct: false },
                    { contentFormatted: '<p>Testing how components work together</p>', correct: true },
                    { contentFormatted: '<p>Testing the user interface</p>', correct: false }
                ]
            }
        }));

        store.dispatch(addQuestion({
            examBodyIndex: 0,
            questionData: {
                contentFormatted: '<p>Which tool is commonly used for JavaScript testing?</p>',
                marks: 3,
                answers: [
                    { contentFormatted: '<p>Jest</p>', correct: true },
                    { contentFormatted: '<p>Excel</p>', correct: false },
                    { contentFormatted: '<p>Photoshop</p>', correct: false }
                ]
            }
        }));

        // Add a standalone question
        store.dispatch(addQuestion({
            examBodyIndex: null,
            questionData: {
                contentFormatted: '<p>What is Redux used for?</p>',
                marks: 5,
                answers: [
                    { contentFormatted: '<p>State management</p>', correct: true },
                    { contentFormatted: '<p>Database access</p>', correct: false },
                    { contentFormatted: '<p>UI styling</p>', correct: false }
                ]
            }
        }));

        // Get current state using selectors
        const state = store.getState();
        const examData = selectExamData(state);
        const allQuestions = selectAllQuestionsFlat(state);
        const totalMarks = selectTotalMarks(state);
        const question2 = selectQuestionByNumber(state, 2);

        // Verify the exam structure
        expect(examData.examTitle).toBe('Integration Test Exam');
        expect(examData.examBody).toHaveLength(2);
        expect(examData.examBody[0].type).toBe('section');
        expect(examData.examBody[0].questions).toHaveLength(2);
        expect(examData.examBody[1].type).toBe('question');

        // Verify question numbering
        expect(examData.examBody[0].questions[0].questionNumber).toBe(1);
        expect(examData.examBody[0].questions[1].questionNumber).toBe(2);
        expect(examData.examBody[1].questionNumber).toBe(3);

        // Test selectors
        expect(allQuestions).toHaveLength(3);
        expect(totalMarks).toBe(10); // 2 + 3 + 5
        expect(question2).toBe(examData.examBody[0].questions[1]);
    });

    test('should maintain data integrity through a series of operations', () => {
        // Create an exam
        store.dispatch(createNewExam({ examTitle: 'Test Exam' }));

        // Add a section and questions
        store.dispatch(addSection({ sectionTitle: 'Section 1' }));
        store.dispatch(addQuestion({
            examBodyIndex: 0,
            questionData: { contentFormatted: '<p>Question 1</p>', marks: 1 }
        }));
        store.dispatch(addQuestion({
            examBodyIndex: 0,
            questionData: { contentFormatted: '<p>Question 2</p>', marks: 2 }
        }));
        store.dispatch(addQuestion({
            examBodyIndex: null,
            questionData: { contentFormatted: '<p>Question 3</p>', marks: 3 }
        }));

        // Update a question
        store.dispatch(updateQuestion({
            location: { examBodyIndex: 0, questionsIndex: 0 },
            newData: { contentFormatted: '<p>Updated Question 1</p>', marks: 4 }
        }));

        // Update a section
        store.dispatch(updateSection({
            examBodyIndex: 0,
            newData: { sectionTitle: 'Updated Section 1' }
        }));

        // Remove a question
        store.dispatch(removeQuestion({ examBodyIndex: 0, questionsIndex: 1 }));

        // Get the current state
        const state = store.getState();
        const examData = selectExamData(state);
        const totalMarks = selectTotalMarks(state);

        // Verify the final state
        expect(examData.examBody).toHaveLength(2);
        expect(examData.examBody[0].sectionTitle).toBe('Updated Section 1');
        expect(examData.examBody[0].questions).toHaveLength(1);
        expect(examData.examBody[0].questions[0].contentFormatted).toBe('<p>Updated Question 1</p>');
        expect(examData.examBody[0].questions[0].marks).toBe(4);
        expect(examData.examBody[1].contentFormatted).toBe('<p>Question 3</p>');

        // Verify question numbering was updated
        expect(examData.examBody[0].questions[0].questionNumber).toBe(1);
        expect(examData.examBody[1].questionNumber).toBe(2);

        // Verify total marks
        expect(totalMarks).toBe(7); // 4 + 3
    });

    test('should handle answer shuffling correctly', () => {
        // Create an exam with specific versions
        store.dispatch(createNewExam({
            examTitle: 'Shuffle Test',
            versions: ['A', 'B']
        }));

        // Add a question with answers
        store.dispatch(addQuestion({
            questionData: {
                contentFormatted: '<p>Test question</p>',
                answers: [
                    { contentFormatted: '<p>Answer 1</p>', correct: true },
                    { contentFormatted: '<p>Answer 2</p>' },
                    { contentFormatted: '<p>Answer 3</p>' },
                    { contentFormatted: '<p>Answer 4</p>' },
                    { contentFormatted: '<p>Answer 5</p>' }
                ]
            }
        }));

        // Get current state
        let state = store.getState();
        let examData = selectExamData(state);
        let question = examData.examBody[0];

        // Verify initial shuffle maps
        expect(question.answerShuffleMaps).toHaveLength(2); // One for each version
        
        // Each map should be a sequence from 0 to 4
        question.answerShuffleMaps.forEach(map => {
            expect(map).toEqual([0, 1, 2, 3, 4]);
        });

        // Regenerate shuffle maps
        store.dispatch(regenerateShuffleMaps());

        // Get updated state
        state = store.getState();
        examData = selectExamData(state);
        question = examData.examBody[0];

        // Verify shuffle maps were regenerated
        expect(question.answerShuffleMaps).toHaveLength(2);
        
        // Each map should be a permutation of indices 0-4
        question.answerShuffleMaps.forEach(map => {
            expect(map.length).toBe(5);
            
            // Should contain all indices from 0 to 4
            const sortedMap = [...map].sort((a, b) => a - b);
            expect(sortedMap).toEqual([0, 1, 2, 3, 4]);
        });
    });

    test('should handle fixed positions in answer shuffling', () => {
        store.dispatch(createNewExam({
            examTitle: 'Fixed Position Test',
            versions: ['A', 'B']
        }));

        store.dispatch(addQuestion({
            questionData: {
                contentFormatted: '<p>Test question</p>',
                answers: [
                    { contentFormatted: '<p>Answer 1</p>' },
                    { contentFormatted: '<p>Answer 2</p>', fixedPosition: 1},
                    { contentFormatted: '<p>Answer 3</p>' },
                    { contentFormatted: '<p>Answer 4</p>' },
                    { contentFormatted: '<p>Answer 5</p>' }
                ]
            }
        }));

        let state = store.getState();
        let examData = selectExamData(state);
        let question = examData.examBody[0];

        store.dispatch(regenerateShuffleMaps());

        state = store.getState();
        examData = selectExamData(state);
        question = examData.examBody[0];

        expect(question.answerShuffleMaps).toHaveLength(2);
        
        // Each map should have the second answer fixed at position 1
        question.answerShuffleMaps.forEach(map => {
            expect(map.length).toBe(5);
            expect(map.includes(1)).toBe(true);
            expect(map[1]).toBe(1);
        });
    });
});