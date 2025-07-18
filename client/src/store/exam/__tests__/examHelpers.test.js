/*
    examHelpers.test.js

    Tests for the exam helper functions.
    Verifies that helper functions correctly manipulate exam data structures.
*/

import {
    updateQuestionHelper,
    removeQuestionHelper,
    renumberQuestions,
    renumberSections,
    normaliseAnswersToLength,
    normaliseAnswersPerTeleformOptions
} from '../examHelpers';

import {
    createExam,
    createSection,
    createQuestion,
} from '../examUtils';

describe('Exam Helpers', () => {
    describe('removeQuestionHelper', () => {
        test('should remove a question from a section', () => {
            // Arrange
            const examBody = [
                {
                    type: 'section',
                    questions: [
                        { id: 'q1', type: 'question' },
                        { id: 'q2', type: 'question' }
                    ]
                }
            ];
            
            // Act
            removeQuestionHelper(examBody, { examBodyIndex: 0, questionsIndex: 0 });
            
            // Assert
            expect(examBody[0].questions).toHaveLength(1);
            expect(examBody[0].questions[0].id).toBe('q2');
        });

        test('should remove a standalone question', () => {
            // Arrange
            const examBody = [
                { id: 'q1', type: 'question' },
                { id: 'q2', type: 'question' }
            ];
            
            // Act
            removeQuestionHelper(examBody, { examBodyIndex: 0 });
            
            // Assert
            expect(examBody).toHaveLength(1);
            expect(examBody[0].id).toBe('q2');
        });

        test('should handle invalid indices gracefully', () => {
            // Arrange
            const examBody = [
                { id: 'q1', type: 'question' }
            ];
            
            // Act & Assert - should not throw
            expect(() => {
                removeQuestionHelper(examBody, { examBodyIndex: 5 });
            }).not.toThrow();
            
            expect(examBody).toHaveLength(1);
        });
    });

    describe('renumberQuestions', () => {
        test('should renumber questions sequentially', () => {
            // Arrange
            const examBody = [
                { type: 'question', questionNumber: 5 },
                {
                    type: 'section',
                    questions: [
                        { type: 'question', questionNumber: 10 },
                        { type: 'question', questionNumber: 15 }
                    ]
                },
                { type: 'question', questionNumber: 20 }
            ];
            
            // Act
            renumberQuestions(examBody);
            
            // Assert
            expect(examBody[0].questionNumber).toBe(1);
            expect(examBody[1].questions[0].questionNumber).toBe(2);
            expect(examBody[1].questions[1].questionNumber).toBe(3);
            expect(examBody[2].questionNumber).toBe(4);
        });

        test('should handle empty exam body', () => {
            // Arrange
            const examBody = [];
            
            // Act & Assert - should not throw
            expect(() => {
                renumberQuestions(examBody);
            }).not.toThrow();
        });

        test('should handle non-question items', () => {
            // Arrange
            const examBody = [
                { type: 'content' },
                { type: 'question', questionNumber: 5 }
            ];
            
            // Act
            renumberQuestions(examBody);
            
            // Assert
            expect(examBody[1].questionNumber).toBe(1);
        });
    });

    describe('renumberSections', () => {
        test('should renumber sections sequentially', () => {
            // Arrange
            const examBody = [
                { type: 'section', sectionNumber: 5 },
                { type: 'question' },
                { type: 'section', sectionNumber: 10 },
                { type: 'section', sectionNumber: 15 }
            ];
            
            // Act
            renumberSections(examBody);
            
            // Assert
            expect(examBody[0].sectionNumber).toBe(1);
            expect(examBody[2].sectionNumber).toBe(2);
            expect(examBody[3].sectionNumber).toBe(3);
        });

        test('should handle empty exam body', () => {
            // Arrange
            const examBody = [];
            
            // Act & Assert - should not throw
            expect(() => {
                renumberSections(examBody);
            }).not.toThrow();
        });

        test('should handle non-section items', () => {
            // Arrange
            const examBody = [
                { type: 'question' },
                { type: 'section', sectionNumber: 5 }
            ];
            
            // Act
            renumberSections(examBody);
            
            // Assert
            expect(examBody[1].sectionNumber).toBe(1);
        });
    });

    describe('normaliseAnswersToLength', () => {
        test('should trim answers if there are too many', () => {
            // Arrange
            const answers = [
                { id: 'a1' },
                { id: 'a2' },
                { id: 'a3' },
                { id: 'a4' },
                { id: 'a5' }
            ];
            
            // Act
            const result = normaliseAnswersToLength(answers, 3);
            
            // Assert
            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('a1');
            expect(result[1].id).toBe('a2');
            expect(result[2].id).toBe('a3');
        });

        test('should add empty answers if there are too few', () => {
            // Arrange
            const answers = [
                { id: 'a1' },
                { id: 'a2' }
            ];
            
            // Act
            const result = normaliseAnswersToLength(answers, 4);
            
            // Assert
            expect(result).toHaveLength(4);
            expect(result[0].id).toBe('a1');
            expect(result[1].id).toBe('a2');
            expect(result[2].type).toBe('answer');
            expect(result[3].type).toBe('answer');
        });

        test('should return the same array if length already matches', () => {
            // Arrange
            const answers = [
                { id: 'a1' },
                { id: 'a2' },
                { id: 'a3' }
            ];
            
            // Act
            const result = normaliseAnswersToLength(answers, 3);
            
            // Assert
            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('a1');
            expect(result[1].id).toBe('a2');
            expect(result[2].id).toBe('a3');
        });
    });

    describe('normaliseAnswersPerTeleformOptions', () => {
        test('should normalize answers for all questions in the exam', () => {
            // Arrange
            const examData = {
                teleformOptions: ['a', 'b', 'c'],
                examBody: [
                    {
                        type: 'question',
                        answers: [{ id: 'a1' }]
                    },
                    {
                        type: 'section',
                        questions: [
                            {
                                type: 'question',
                                answers: [{ id: 'a2' }, { id: 'a3' }, { id: 'a4' }, { id: 'a5' }]
                            }
                        ]
                    }
                ]
            };
            
            // Act
            normaliseAnswersPerTeleformOptions(examData);
            
            // Assert
            expect(examData.examBody[0].answers).toHaveLength(3);
            expect(examData.examBody[0].answers[0].id).toBe('a1');
            
            expect(examData.examBody[1].questions[0].answers).toHaveLength(3);
            expect(examData.examBody[1].questions[0].answers[0].id).toBe('a2');
            expect(examData.examBody[1].questions[0].answers[1].id).toBe('a3');
            expect(examData.examBody[1].questions[0].answers[2].id).toBe('a4');
        });

        test('should handle questions with no answers array', () => {
            // Arrange
            const examData = {
                teleformOptions: ['a', 'b', 'c'],
                examBody: [
                    {
                        type: 'question',
                        // No answers array
                    }
                ]
            };
            
            // Act & Assert - should not throw
            expect(() => {
                normaliseAnswersPerTeleformOptions(examData);
            }).not.toThrow();
        });

        test('should handle empty exam body', () => {
            // Arrange
            const examData = {
                teleformOptions: ['a', 'b', 'c'],
                examBody: []
            };
            
            // Act & Assert - should not throw
            expect(() => {
                normaliseAnswersPerTeleformOptions(examData);
            }).not.toThrow();
        });
    });

    describe('updateQuestionHelper', () => {
        test('should update a question in a section', () => {
            // Arrange
            const examBody = [
                {
                    type: 'section',
                    questions: [
                        { id: 'q1', contentFormatted: 'Original' }
                    ]
                }
            ];
            
            // Act
            updateQuestionHelper(examBody, { examBodyIndex: 0, sectionIndex: 0 }, { contentFormatted: 'Updated' });
            
            // Assert
            expect(examBody[0].questions[0].contentFormatted).toBe('Updated');
        });

        test('should update a standalone question', () => {
            // Arrange
            const examBody = [
                { id: 'q1', type: 'question', contentFormatted: 'Original' }
            ];
            
            // Act
            updateQuestionHelper(examBody, { examBodyIndex: 0 }, { contentFormatted: 'Updated' });
            
            // Assert
            expect(examBody[0].contentFormatted).toBe('Updated');
        });

        test('should handle invalid indices gracefully', () => {
            // Arrange
            const examBody = [
                { id: 'q1', type: 'question', contentFormatted: 'Original' }
            ];
            
            // Act & Assert - should not throw
            expect(() => {
                updateQuestionHelper(examBody, { examBodyIndex: 5 }, { contentFormatted: 'Updated' });
            }).not.toThrow();
            
            expect(examBody[0].contentFormatted).toBe('Original');
        });
    });

    test('should create an exam with default values', () => {
        const exam = createExam();
        expect(exam).toHaveProperty('type', 'exam');
        expect(exam).toHaveProperty('examTitle', '');
        expect(exam).toHaveProperty('examBody', []);
    });

    test('should create an exam with overridden values', () => {
        const exam = createExam({
            examTitle: 'Test Exam',
            courseCode: 'TEST101'
        });
        expect(exam).toHaveProperty('examTitle', 'Test Exam');
        expect(exam).toHaveProperty('courseCode', 'TEST101');
    });

    test('should create a section with questions', () => {
        const section = createSection({
            sectionTitle: 'Test Section',
            questions: [
                createQuestion({ contentFormatted: 'Q1' }),
                createQuestion({ contentFormatted: 'Q2' })
            ]
        });
        expect(section).toHaveProperty('sectionTitle', 'Test Section');
        expect(section.questions).toHaveLength(2);
    });
});