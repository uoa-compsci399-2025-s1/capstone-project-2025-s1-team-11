/**
 * @jest-environment jsdom
 */

// __tests__/fileSystemAccess.test.js
import { loadExamFromFile, saveExamToDisk } from '../fileSystemAccess'

// Mocking global window methods
const mockFileHandle = {
    getFile: jest.fn(),
    createWritable: jest.fn(),
};

// Mock store
jest.mock('../../store/store', () => ({
    store: {
        getState: jest.fn(() => ({
            exam: {
                examData: {}
            },
            teleform: {
                teleformData: ''
            }
        }))
    }
}));

describe('fileSystemAccess service', () => {
    let originalConsoleError;

    beforeEach(() => {
        jest.clearAllMocks();
        // Save original console.error
        originalConsoleError = console.error;
        // Replace with a mock
        console.error = jest.fn();
    });

    afterEach(() => {
        // Restore original console.error
        console.error = originalConsoleError;
    });

    describe('loadExamFromFile', () => {
        it('shoulandd open a file, read its contents,  parse it', async () => {
            const mockExam = {
                title: 'Test Exam',
                schemaVersion: '1.0.0',
                teleformOptions: ['a', 'b', 'c', 'd', 'e'],
                examBody: []
            };
            const fileContents = JSON.stringify(mockExam);
            const mockFile = { text: jest.fn().mockResolvedValue(fileContents) };

            global.window.showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);
            mockFileHandle.getFile.mockResolvedValue(mockFile);

            const result = await loadExamFromFile();

            expect(window.showOpenFilePicker).toHaveBeenCalledTimes(1);
            expect(mockFileHandle.getFile).toHaveBeenCalledTimes(1);
            expect(result.exam).toEqual(mockExam);
            expect(result.fileHandle).toBe(mockFileHandle);
        });

        it('should return null if user cancels file open', async () => {
            global.window.showOpenFilePicker = jest.fn().mockRejectedValue(new Error('User cancelled'));

            const result = await loadExamFromFile();

            expect(result).toBeNull();
        });
    });

    describe('saveExamToDisk', () => {
        let mockFileHandle;
        let mockWritable;

        beforeEach(() => {
            // Reset mocks
            mockWritable = {
                write: jest.fn(),
                close: jest.fn()
            };

            mockFileHandle = {
                createWritable: jest.fn().mockResolvedValue(mockWritable)
            };

            // Mock window.showSaveFilePicker
            window.showSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle);
        });

        it('should save exam to an existing fileHandle', async () => {
            const examData = { title: 'Test Save Exam' };
            const examState = { examData };
            const expectedData = {
                exam: {
                    examData
                },
                teleform: {
                    teleformData: ''
                }
            };

            const result = await saveExamToDisk(examState, mockFileHandle);

            expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1);
            expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(expectedData, null, 2));
            expect(mockWritable.close).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockFileHandle);
        });

        it('should prompt for a new fileHandle if none provided', async () => {
            const examData = { title: 'Test New Save Exam' };
            const examState = { examData };
            const expectedData = {
                exam: {
                    examData
                },
                teleform: {
                    teleformData: ''
                }
            };

            const result = await saveExamToDisk(examState);

            expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
            expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1);
            expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(expectedData, null, 2));
            expect(mockWritable.close).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockFileHandle);
        });

        it('should return null if save fails', async () => {
            global.window.showSaveFilePicker = jest.fn().mockRejectedValue(new Error('Save cancelled'));

            const result = await saveExamToDisk({ title: 'Error Exam' });

            expect(result).toBeNull();
        });
    });
});