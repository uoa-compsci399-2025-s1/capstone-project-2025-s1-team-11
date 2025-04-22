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
        return { fileHandle, exam: parsed };
    } catch (error) {
        console.error("Error opening file:", error);
        return null;
    }
}

/**
 * Saves the given exam to the file represented by fileHandle.
 */
export async function saveExamToFile(exam, fileHandle = null) {
    // If no file handle exists, prompt the user for a save location.
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
    // Create a writable stream, write the JSON content, and close the stream.
    const writable = await fileHandle.createWritable();
    await writable.write(exam.toJSON());
    await writable.close();
    return fileHandle; // Return the file handle so it can be stored for future saves.
}