// src/services/fileSystemAccess.js

/*
 * Important: This module does not handle the importing of exams, this is simply used to retrieve the exam from a file.
 * Do not use this module to import an exam. Use the hook.
 */

import { needsMigration, migrateExam } from '../store/exam/examUtils';

/**
 * Opens a file picker and reads an exam from a JSON file.
 * Returns an object with the file handle and the parsed Exam instance.
 * If the exam schema is outdated, it will be automatically migrated.
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
      let savedData = JSON.parse(text);
      
      // Handle different save formats and extract data
      let examData, teleformData, coverPage, mathRegistry;
      
        examData = savedData.exam.examData || null;
        coverPage = savedData.exam.coverPage || null;
        mathRegistry = savedData.exam.mathRegistry || null;
        teleformData = savedData.teleform.teleformData || null;

      // Check if exam needs migration
      if (needsMigration(examData)) {
        console.log('Migrating exam from older schema version...');
        examData = migrateExam(examData);
      }
  
      return { examData, teleformData, coverPage, mathRegistry, fileHandle };
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
                description: 'DOCX, Moodle XML, LaTeX Files', 
                accept: {
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'application/xml': ['.xml'],
                    'application/x-tex': ['.tex']
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
export async function saveExamToDisk(examData=null, coverPage=null, mathRegistry=null, teleformData=null, fileHandle = null) {
    // If no file handle exists, prompt the user for a save location.
    try {
        if (!fileHandle) {
            // This operation requires a user gesture (like a click)
            // It will fail with security error if called without user interaction
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

        // Create a combined object with both exam and teleform data
        const saveData = {
            exam: {
                examData: examData || null,
                coverPage: coverPage || null,
                mathRegistry: mathRegistry || null
            },
            
            teleform: {
                teleformData: teleformData || null
            }
        };
        
        // Create a writable stream, write the JSON content, and close the stream.
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(saveData, null, 2));
        await writable.close();
        return fileHandle; // Return the file handle so it can be stored for future saves.
    } catch (err) {
        // Log error details for debugging
        console.error("Failed to save:", err.name, err.message);
        return null;  // Keep existing behavior of returning null on error
    } 
}
