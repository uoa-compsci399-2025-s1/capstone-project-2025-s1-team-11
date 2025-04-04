// src/services/fileSystemAccess.js

import Exam from "../models/ExamFS.js";

/**
 * Opens a file picker and reads an exam from a JSON file.
 * Returns an object with the file handle and the parsed Exam instance.
 */
export async function openExamFile() {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [
                {
                    description: "JSON Files",
                    accept: { "application/json": [".json"] },
                },
            ],
            multiple: false,
        });
        const file = await fileHandle.getFile();
        const contents = await file.text();
        return { fileHandle, exam: Exam.fromJSON(contents) };
    } catch (error) {
        console.error("Error opening file:", error);
        return null;
    }
}

/**
 * Saves the given exam to the file represented by fileHandle.
 */
export async function saveExamToFile(exam, fileHandle) {
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(exam.toJSON());
        await writable.close();
        console.log("File saved successfully!");
    } catch (error) {
        console.error("Error saving file:", error);
    }
}