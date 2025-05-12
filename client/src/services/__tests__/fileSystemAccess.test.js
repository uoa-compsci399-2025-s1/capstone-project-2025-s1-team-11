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

const mockWritable = {
    write: jest.fn(),
    close: jest.fn(),
};

describe('fileSystemAccess service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadExamFromFile', () => {
        it('shoulandd open a file, read its contents,  parse it', async () => {
            const mockExam = { title: 'Test Exam' };
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
        it('should save exam to an existing fileHandle', async () => {
            mockFileHandle.createWritable.mockResolvedValue(mockWritable);

            const examData = { title: 'Test Save Exam' };

            const result = await saveExamToDisk(examData, mockFileHandle);

            expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1);
            expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(examData, null, 2));
            expect(mockWritable.close).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockFileHandle);
        });

        it('should prompt for a new fileHandle if none provided', async () => {
            global.window.showSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle);
            mockFileHandle.createWritable.mockResolvedValue(mockWritable);

            const examData = { title: 'Test New Save Exam' };

            const result = await saveExamToDisk(examData);

            expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
            expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1);
            expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(examData, null, 2));
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