// src/services/fileSystemAccess.js

/*
 * Important: This module does not handle the importing of exams, this is simply used to retrieve the exam from a file.
 * Do not use this module to import an exam. Use the hook.
 */

/**
 * Opens a file picker and reads an exam from a JSON file.
 * Returns an object with the file handle and the parsed Exam instance.
 */

export async function loadExamFromFile() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
            { 
                description: 'JSON Exam Files', 
                accept: { 'application/json': ['.json'] } 
            }
        ],
        multiple: false,
      });
  
      const file = await fileHandle.getFile();
      const text = await file.text();
      const exam = JSON.parse(text);
      return { exam, fileHandle};
    } catch (err) {
      console.error("File open cancelled or failed:", err);
      return null;
    }
}

export async function importExamFile() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
            { 
                description: 'DOCX, Moodle XML Files', 
                accept: {
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'application/xml': ['.xml']
                } 
            }
        ],
        multiple: false,
      });
  
      const file = await fileHandle.getFile();
      return file;
    } catch (err) {
      console.error("File open cancelled or failed:", err);
      return null;
    }
}
  
/**
 * Saves the given exam to the file represented by fileHandle.
 */
export async function saveExamToDisk(exam, fileHandle = null) {
    // If no file handle exists, prompt the user for a save location.
    try {
        if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: "Exam.json",
                types: [
                    {
                        description: "JSON Exam Files",
                        accept: { "application/json": [".json"] },
                    },
                ],
            });
        }
        // Create a writable stream, write the JSON content, and close the stream.
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(exam, null, 2));
        await writable.close();
        return fileHandle; // Return the file handle so it can be stored for future saves.
    } catch (err) {
        console.error("Failed to save:", err);
        return null;
    } 
    
}
