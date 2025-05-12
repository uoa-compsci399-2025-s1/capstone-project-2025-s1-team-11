/*
    selectors.test.js

    Tests for the exam Redux selectors.
    Verifies that selectors correctly extract and derive data from the state.
*/

import {
    selectExamState,
    selectExamData,
    selectExamMetadata,
    selectExamBody,
    selectSectionByIndex,
    selectQuestionByPath,
    selectQuestionByNumber,
    selectAllQuestionsFlat,
    selectTotalMarks,
    selectQuestionsForTable
} from '../selectors';

describe('Exam Selectors', () => {
    // Setup mock state for testing
    const mockState = {
        exam: {
            examData: {
                examTitle: 'Test Exam',
                courseCode: 'TEST101',
                metadata: {
                    author: 'Test Author',
                    department: 'Computer Science'
                },
                examBody: [
                    {
                        type: 'section',
                        id: 'section-1',
                        sectionTitle: 'Section 1',
                        sectionNumber: 1,
                        questions: [
                            {
                                type: 'question',
                                id: 'question-1',
                                questionNumber: 1,
                                contentText: 'Question 1',
                                marks: 2,
                                answers: [
                                    { contentText: 'Answer 1', correct: true },
                                    { contentText: 'Answer 2', correct: false }
                                ]
                            },
                            {
                                type: 'question',
                                id: 'question-2',
                                questionNumber: 2,
                                contentText: 'Question 2',
                                marks: 3,
                                answers: [
                                    { contentText: 'Answer 1', correct: false },
                                    { contentText: 'Answer 2', correct: true }
                                ]
                            }
                        ]
                    },
                    {
                        type: 'question',
                        id: 'question-3',
                        questionNumber: 3,
                        contentText: 'Question 3',
                        marks: 5,
                        answers: [
                            { contentText: 'Answer 1', correct: true },
                            { contentText: 'Answer 2', correct: false }
                        ]
                    }
                ]
            },
            isLoading: false,
            error: null
        }
    };

    test('selectExamState should return the exam state', () => {
        expect(selectExamState(mockState)).toBe(mockState.exam);
    });

    test('selectExamData should return the exam data', () => {
        expect(selectExamData(mockState)).toBe(mockState.exam.examData);
    });

    test('selectExamMetadata should return the exam metadata', () => {
        expect(selectExamMetadata(mockState)).toEqual({
            author: 'Test Author',
            department: 'Computer Science'
        });
    });

    test('selectExamBody should return the exam body', () => {
        expect(selectExamBody(mockState)).toBe(mockState.exam.examData.examBody);
    });

    test('selectSectionByIndex should return the correct section', () => {
        const section = selectSectionByIndex(mockState, 0);
        expect(section).toBe(mockState.exam.examData.examBody[0]);
        expect(section.type).toBe('section');
        expect(section.sectionTitle).toBe('Section 1');
    });

    test('selectSectionByIndex should return null for non-section items', () => {
        const section = selectSectionByIndex(mockState, 1);
        expect(section).toBeNull();
    });

    test('selectQuestionByPath should return a question from a section', () => {
        const question = selectQuestionByPath(mockState, 0, 0);
        expect(question).toBe(mockState.exam.examData.examBody[0].questions[0]);
        expect(question.type).toBe('question');
        expect(question.contentText).toBe('Question 1');
    });

    test('selectQuestionByPath should return a standalone question', () => {
        const question = selectQuestionByPath(mockState, 1, 1);
        expect(question).toBe(mockState.exam.examData.examBody[1]);
        expect(question.type).toBe('question');
        expect(question.contentText).toBe('Question 3');
    });

    test('selectQuestionByPath should return null for invalid paths', () => {
        expect(selectQuestionByPath(mockState, 5, 0)).toBeNull();
        expect(selectQuestionByPath(mockState, 0, 5)).toBeNull();
    });

    test('selectQuestionByNumber should find a question by its number', () => {
        const question = selectQuestionByNumber(mockState, 2);
        expect(question).toBe(mockState.exam.examData.examBody[0].questions[1]);
        expect(question.contentText).toBe('Question 2');
    });

    test('selectQuestionByNumber should return null for non-existent question numbers', () => {
        expect(selectQuestionByNumber(mockState, 10)).toBeNull();
    });

    test('selectAllQuestionsFlat should return all questions in a flat array', () => {
        const questions = selectAllQuestionsFlat(mockState);
        expect(questions).toHaveLength(3);
        expect(questions[0].contentText).toBe('Question 1');
        expect(questions[1].contentText).toBe('Question 2');
        expect(questions[2].contentText).toBe('Question 3');
    });

    test('selectTotalMarks should calculate the total marks correctly', () => {
        expect(selectTotalMarks(mockState)).toBe(10); // 2 + 3 + 5
    });

    test('selectQuestionsForTable should format questions for table display', () => {
        const tableQuestions = selectQuestionsForTable(mockState);
        expect(tableQuestions).toHaveLength(3);
        
        // Check first question (from section)
        expect(tableQuestions[0].sectionNumber).toBe(1);
        expect(tableQuestions[0].questionNumber).toBe(1);
        expect(tableQuestions[0].questionText).toBe('Question 1');
        expect(tableQuestions[0].marks).toBe(2);
        
        // Check standalone question
        expect(tableQuestions[2].sectionNumber).toBeNull();
        expect(tableQuestions[2].questionNumber).toBe(3);
        expect(tableQuestions[2].questionText).toBe('Question 3');
        expect(tableQuestions[2].marks).toBe(5);
    });

    test('selectors should handle null or undefined state gracefully', () => {
        const emptyState = { exam: { examData: null } };
        
        expect(selectExamData(emptyState)).toBeNull();
        expect(selectExamMetadata(emptyState)).toBeUndefined();
        expect(selectExamBody(emptyState)).toBeUndefined();
        expect(selectSectionByIndex(emptyState, 0)).toBeNull();
        expect(selectQuestionByPath(emptyState, 0, 0)).toBeNull();
        expect(selectQuestionByNumber(emptyState, 1)).toBeNull();
        expect(selectAllQuestionsFlat(emptyState)).toEqual([]);
        expect(selectTotalMarks(emptyState)).toBe(0);
        expect(selectQuestionsForTable(emptyState)).toEqual([]);
    });
});