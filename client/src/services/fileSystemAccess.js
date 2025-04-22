// src/services/fileSystemAccess.js

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
        const parsed = JSON.parse(contents); // parse here
        // Wrap parsed object to ensure it becomes a valid exam instance if needed
        const exam = parsed; // Placeholder for future integration with exam model classes
        return { fileHandle, exam };
    } catch (error) {
        console.error("Error opening file:", error);
        return null;
    }
}

/**
 * Saves the given exam to the file represented by fileHandle.
 */
export async function saveExamToFile(exam, fileHandle = null) {
    if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
            suggestedName: "Exam.json",
            types: [
                {
                    description: "JSON Files",
                    accept: { "application/json": [".json"] },
                },
            ],
        });
    }

    try {
        const writable = await fileHandle.createWritable();
        const examJSON = typeof exam.toJSON === 'function' ? exam.toJSON() : JSON.stringify(exam, null, 2);
        await writable.write(examJSON);
        await writable.close();
        return fileHandle;
    } catch (error) {
        console.error("Failed to save exam:", error);
        throw error;
    }
}