// src/hooks/useFileSystem.js

/*
 * Important: This file does not load exams and is not used to access the files itself, it is the hook between them.
 * You should use this file to handle those actions.
 */

import { useDispatch, useSelector } from 'react-redux';
import {initialiseExamState, clearExamState, setFileName, setCoverPage, setMathRegistry} from '../store/exam/examSlice';
import { loadExamFromFile, saveExamToDisk } from '../services/fileSystemAccess.js';
import examImportService  from '../services/examImportService.js';
import { importDTOToState } from '../services/examImportService.js';
import { setTeleformData } from '../store/exam/teleformSlice';
import { useState } from 'react'; // for local fileHandle if not stored in Redux
import { selectExamData, selectTeleformData, selectCoverPage, selectMathRegistry } from '../store/exam/selectors';

export function useFileSystem() {
    const dispatch = useDispatch();
    const examData = useSelector(selectExamData);
    const coverPage = useSelector(selectCoverPage);
    const mathRegistry = useSelector(selectMathRegistry);
    const teleformData = useSelector(selectTeleformData);
    const [fileHandle, setFileHandle] = useState(null);

    // Opens the exam file and updates the global state
    const openExam = async () => {
      const result = await loadExamFromFile();
      if (result) {
        // Initialize exam state
        dispatch(initialiseExamState(result.examData));
        // Initialize teleform data if it exists in the loaded data
        dispatch(setCoverPage(result.coverPage));
        dispatch(setMathRegistry(result.mathRegistry));
        dispatch(setTeleformData(result.teleformData || ''));
        setFileHandle(result.fileHandle);
        dispatch(setFileName(result.fileHandle?.name || null));
      }
      return result;
    };

    const createExam = async (examData) => {
        dispatch(initialiseExamState(examData));
        dispatch(setTeleformData('')); // Clear any existing teleform data
        setFileHandle(null);
        dispatch(setFileName(null));
    };

    // Saves the exam and updates the file handle in the global state
    const saveExam = async () => {
        if (!examData) return null;

        const updatedHandle = await saveExamToDisk(examData, coverPage, mathRegistry, teleformData, fileHandle);
        if (updatedHandle) {
            setFileHandle(updatedHandle);
            dispatch(setFileName(updatedHandle?.name || null));
        }
        return updatedHandle;
    };

    const importExam = async (file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      const formatToUse = ext === 'xml' ? 'moodle' : ext === 'docx' ? 'docx' : ext === 'tex' ? 'latex' : null;
      if (!formatToUse) {
          throw new Error("Unsupported file format. Please use .xml, .docx, or .tex files.");
      }

      // Process the file using the examImportService to get the DTO
      const examDTO = await examImportService.importExamToDTO(file, formatToUse);

      // For DOCX imports, also get the math registry
      const mathRegistry = formatToUse === 'docx' ? examImportService.mathRegistry : null;

      // Update the application state with the DTO and math registry
      dispatch(importDTOToState(examDTO, mathRegistry));
      dispatch(setTeleformData('')); // Clear any existing teleform data
      setFileHandle(null); // reset file handle, this wasn't opened from disk
      dispatch(setFileName(null));

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
        await importExam(file); // Call importExam with just the file parameter
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
        exam: examData,
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