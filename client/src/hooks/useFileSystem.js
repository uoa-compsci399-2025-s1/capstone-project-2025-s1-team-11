// src/hooks/useFileSystem.js

/*
 * Important: This file does not load exams and is not used to access the files itself, it is the hook between them.
 * You should use this file to handle those actions.
 */

import { useDispatch, useSelector } from 'react-redux';
import {initialiseExamState, clearExamState, setFileName} from '../store/exam/examSlice';
import { selectExamData } from '../store/exam/selectors';
import { selectTeleformData } from '../store/exam/selectors';
import { loadExamFromFile, saveExamToDisk } from '../services/fileSystemAccess.js';
import examImportService  from '../services/examImportService.js';
import { importDTOToState } from '../services/examImportService.js';
import { setTeleformData } from '../store/exam/teleformSlice';
import { useState } from 'react'; // for local fileHandle if not stored in Redux

export function useFileSystem() {
    const dispatch = useDispatch();
    const examState = useSelector(state => state.exam);
    const [fileHandle, setFileHandle] = useState(null);
  
    // Opens the exam file and updates the global state
    const openExam = async () => {
      const result = await loadExamFromFile();
      if (result) {
        // Initialize exam state
        dispatch(initialiseExamState(result.exam));
        // Initialize teleform data if it exists in the loaded data
        dispatch(setTeleformData(result.teleformData || ''));
        setFileHandle(result.fileHandle);
        dispatch(setFileName(result.fileHandle?.name || null));
      }
      return result;
    };

    const createExam = async (exam) => {
        dispatch(initialiseExamState(exam));
        dispatch(setTeleformData('')); // Clear any existing teleform data
        setFileHandle(null);
        dispatch(setFileName(null));
    };

    // Saves the exam and updates the file handle in the global state
    const saveExam = async () => {
        if (!examState.examData) return null;
        const updatedHandle = await saveExamToDisk(examState, fileHandle);
        if (updatedHandle) {
            setFileHandle(updatedHandle);
            dispatch(setFileName(updatedHandle?.name || null));
        }
        return updatedHandle;
    };

    const importExam = async (file, format) => {
        try {
            // If format is 'all' or not specified, determine it from file extension
            let formatToUse = format;
            if (!format || format === 'all') {
                const ext = file.name.split('.').pop().toLowerCase();
                formatToUse = ext === 'xml' ? 'moodle' : ext === 'docx' ? 'docx' : ext === 'tex' ? 'latex' : null;
                
                if (!formatToUse) {
                    throw new Error("Unsupported file format. Please use .xml, .docx, or .tex files.");
                }
            } else if (!['docx', 'moodle', 'latex'].includes(formatToUse)) {
                throw new Error(`Unsupported format: ${formatToUse}. Supported formats are: docx, moodle, latex.`);
            }
            
            // Process the file using the examImportService to get the DTO
            const examDTO = await examImportService.importExamToDTO(file, formatToUse);
            
            // Update the application state with the DTO
            dispatch(importDTOToState(examDTO));
            dispatch(setTeleformData('')); // Clear any existing teleform data
            setFileHandle(null); // reset file handle, this wasn't opened from disk
            dispatch(setFileName(null));
            
            return true;
        } catch (error) {
            throw new Error("Error importing exam: " + error.message);
        }
    };

    const importFromFileInput = async (file, onError) => {
      const ext = file.name.split('.').pop().toLowerCase();
      const format = ext === 'xml' ? 'moodle' : ext === 'docx' ? 'docx' : null;

      if (!format) {
        onError?.("Unsupported file format");
        return;
      }

      try {
        await importExam(file, format);
        return true;
      } catch (err) {
        console.error("Import error:", err);
        onError?.("Error importing exam: " + err.message);
        return false;
      }
    };

    const closeExam = () => {
        dispatch(clearExamState());
        dispatch(setTeleformData('')); // Clear teleform data
        setFileHandle(null);
        dispatch(setFileName(null));
    };

    return { 
        exam: examState.examData, 
        fileHandle, 
        setFileHandle,
        openExam, 
        createExam, 
        saveExam, 
        importExam, 
        closeExam, 
        importFromFileInput 
    };
}