/*
    EXAMPLE_questionModel.test.js

    Run all testing using: npm test (from client)

    Run this test specifically using: npm test -- EXAMPLE_questionModel.test.js

    This Unit test verifies that:

    - Questions can be added to an exam
    - They have the correct structure and properties
    - Answer arrays are properly normalized
*/


import { configureStore } from '@reduxjs/toolkit';
import examReducer, {
    createNewExam,
    addQuestion,
    updateQuestion,
    removeQuestion
} from '../examSlice';

import { selectExamData } from '../selectors';

// Mock document.createElement for htmlToText function
document.createElement = jest.fn(() => ({
    innerHTML: '',
    textContent: 'mocked content',
    innerText: ''
}));

describe('Question Model', () => {
    let store;

    // Setup fresh store before each test
    beforeEach(() => {
        store = configureStore({
            reducer: { exam: examReducer }
        });

        // Create a base exam for testing
        store.dispatch(createNewExam({
            examTitle: 'Test Exam',
            courseCode: 'CS101'
        }));
    });

    test('should add a question with correct structure', () => {
        // Arrange
        const questionData = {
            contentFormatted: '<p>What is 2+2?</p>',
            marks: 5,
            answers: [
                { contentFormatted: '<p>4</p>', correct: true },
                { contentFormatted: '<p>5</p>', correct: false }
            ]
        };

        // Act
        store.dispatch(addQuestion({
            examBodyIndex: null, // Add directly to examBody
            questionData
        }));

        // Assert
        const state = store.getState();
        const exam = selectExamData(state);

        // Verify question was added
        expect(exam.examBody.length).toBe(1);
        expect(exam.examBody[0].type).toBe('question');

        // Verify question properties
        const question = exam.examBody[0];
        expect(question.marks).toBe(5);
        expect(question.contentFormatted).toBe('<p>What is 2+2?</p>');
        expect(question.questionNumber).toBe(1); // Should be auto-numbered

        // Verify answers
        expect(question.answers.length).toBe(5); // Should match default teleformOptions count
        expect(question.answers[0].correct).toBe(true);
        expect(question.answers[1].correct).toBe(false);
    });
});
