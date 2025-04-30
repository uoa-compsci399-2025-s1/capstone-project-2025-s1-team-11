// src/hooks/useFileSystem.js
import { useDispatch, useSelector } from 'react-redux';
import { createNewExam, importDTOToState } from '../store/exam/examSlice';
import { selectExamData } from '../store/exam/selectors';
import { openExamFile, saveExamToFile } from '../services/fileSystemAccess.js';
import examImportService from '../services/examImportService.js';

import { useState } from 'react'; // for local fileHandle if not stored in Redux



export function useFileSystem() {

    //Check changes...
    const dispatch = useDispatch();
    const exam = useSelector(selectExamData);
  
    const [fileHandle, setFileHandle] = useState(null);
  
    // Opens the exam file and updates the global state
    const openExam = async () => {
      const result = await openExamFile();
  
      if (result) {
        dispatch(createNewExam(result.exam)); // replace with your actual action
        setFileHandle(result.fileHandle);
      }
      return result;
    };

    // Saves the exam and updates the file handle in the global state
    const saveExam = async () => {
        if (!exam) return null;
        const updatedHandle = await saveExamToFile(exam, fileHandle);
        setFileHandle(updatedHandle);
        return updatedHandle;
    };

  // Imports the exam from a file (docx, xml, etc.)
    const importExam = async (file, format) => {
        try {
        const examDTO = await examImportService.importExamToDTO(file, format);
        dispatch(importDTOToState(examDTO));
        //dispatch(createNewExam(examData)); 
        return true;
        } catch (error) {
        throw new Error("Error importing exam: " + error.message);
        }
    };

    return { exam, fileHandle, openExam, saveExam, importExam };
}