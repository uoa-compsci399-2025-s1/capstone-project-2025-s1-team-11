// src/hooks/useFileSystem.js

/*
 * Important: This file does not load exams and is not used to access the files itself, it is the hook between them.
 * You should use this file to handle those actions.
 */

import { useDispatch, useSelector } from 'react-redux';
import {initializeExamState, importDTOToState, clearExamState} from '../store/exam/examSlice';
import { selectExamData } from '../store/exam/selectors';
import { loadExamFromFile, saveExamToDisk } from '../services/fileSystemAccess.js';
import examImportService from '../services/examImportService.js';

import { useState } from 'react'; // for local fileHandle if not stored in Redux

export function useFileSystem() {
    //Check changes...
    const dispatch = useDispatch();
    const exam = useSelector(selectExamData);
    const [fileHandle, setFileHandle] = useState(null);
  
    // Opens the exam file and updates the global state
    const openExam = async () => {
      const result = await loadExamFromFile();
      if (result) {
        dispatch(initializeExamState(result.exam));
        setFileHandle(result.fileHandle);
      }
      return result;
    };

    const createExam = async (exam) => {
        dispatch(initializeExamState(exam));
        setFileHandle(null);
    };

    // Saves the exam and updates the file handle in the global state
    const saveExam = async () => {
        if (!exam) return null;
        const updatedHandle = await saveExamToDisk(exam, fileHandle);
        setFileHandle(updatedHandle);
        return updatedHandle;
    };

    const importExam = async (file, format) => {
      const dto = await examImportService.importExamToDTO(file, format);
      dispatch(importDTOToState(dto));
      setFileHandle(null); // reset file handle, this wasn't opened from disk
      return true;
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
        setFileHandle(null);
      };

    return { exam, fileHandle, openExam, createExam, saveExam, importExam, closeExam, importFromFileInput };
}