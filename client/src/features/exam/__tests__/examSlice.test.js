import examReducer, { examAdded, examUpdated, examDeleted } from '../examSlice';

describe('examSlice reducer', () => {
    const initialState = {
        exams: [],
        status: 'idle',
        error: null,
    };

    it('should return the initial state', () => {
        expect(examReducer(undefined, {})).toEqual(initialState);
    });

    it('should handle addExam', () => {
        const newExam = { id: '1', title: 'Sample Exam' };
        const action = examAdded(newExam);
        const state = examReducer(initialState, action);

        expect(state.exams).toHaveLength(1);
        expect(state.exams[0]).toEqual(newExam);
    });

    it('should handle updateExam', () => {
        const initial = {
            exams: [{ id: '1', title: 'Old Title' }],
        };
        const updated = { id: '1', title: 'Updated Title' };
        const action = examUpdated(updated);
        const state = examReducer(initial, action);

        expect(state.exams[0].title).toBe('Updated Title');
    });

    it('should handle deleteExam', () => {
        const initial = {
            exams: [{ id: '1', title: 'To Delete' }],
        };
        const action = examDeleted('1');
        const state = examReducer(initial, action);

        expect(state.exams).toHaveLength(0);
    });
});