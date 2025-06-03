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
        it('should open a file, read its contents,  parse it', async () => {
            const mockExam = {
                title: 'Test Exam',
                schemaVersion: '1.0.0',
                teleformOptions: ['a', 'b', 'c', 'd', 'e'],
                examBody: []
            };
            const fileContents = JSON.stringify({
                exam: {
                    examData: mockExam
                },
                teleform: {
                    teleformData: 'test-teleform'
                }
            });
            const mockFile = { text: jest.fn().mockResolvedValue(fileContents) };

            global.window.showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);
            mockFileHandle.getFile.mockResolvedValue(mockFile);

            const result = await loadExamFromFile();

            expect(window.showOpenFilePicker).toHaveBeenCalledTimes(1);
            expect(mockFileHandle.getFile).toHaveBeenCalledTimes(1);
            expect(result.examData).toEqual(mockExam);
            expect(result.teleformData).toEqual('test-teleform');
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
            const coverPage = null;
            const mathRegistry = null;
            const teleformData = null;
            const expectedData = {
                exam: {
                    examData: examData,
                    coverPage: coverPage,
                    mathRegistry: mathRegistry
                },
                teleform: {
                    teleformData: teleformData
                }
            };

            const result = await saveExamToDisk(examData, coverPage, mathRegistry, teleformData, mockFileHandle);
            expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1);
            expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(expectedData, null, 2));
            expect(mockWritable.close).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockFileHandle);
        });

        it('should prompt for a new fileHandle if none provided', async () => {
            const examData = { title: 'Test Save Exam' };
            const coverPage = null;
            const mathRegistry = null;
            const teleformData = null;
            const expectedData = {
                exam: {
                    examData: examData,
                    coverPage: coverPage,
                    mathRegistry: mathRegistry
                },
                teleform: {
                    teleformData: teleformData
                }
            };

            const result = await saveExamToDisk(examData, coverPage, mathRegistry, teleformData);

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