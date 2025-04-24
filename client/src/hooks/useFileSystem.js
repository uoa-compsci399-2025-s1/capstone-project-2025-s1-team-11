// src/hooks/useFileSystem.js
import { useDispatch, useSelector } from 'react-redux';
import { createNewExam, clearExam } from '../store/exam/examSlice'; // Or whatever action sets exam
import { selectExamData } from '../store/exam/selectors';
import { openExamFile, saveExamToFile } from '../services/fileSystemAccess.js';
// import { importExamFromXMLtoJSON } from '../services/xmlToJsonExamImporter.js'; // or examImportService

import { useState } from 'react'; // for local fileHandle if not stored in Redux



export function useFileSystem() {
    const examContext = useExam();

    if (!examContext) {
        console.error("ExamContext not found. Is <ExamProvider> wrapped around your app?");
        return {};
    }

    //Check changes...
    const { exam, setExam, fileHandle, setFileHandle } = examContext;
    const dispatch = useDispatch();
    const exam = useSelector(selectExamData);

    const [fileHandle, setFileHandle] = useState(null); // or move this into Redux

    // Opens the exam file and updates the global state
    const openExam = async () => {
        const result = await openExamFile();

        //fromJSON?
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

    // Imports the exam from an XML file using a Promise wrapper
    // Based on initial XML tests - not for actual Coderunner XML's
    const importExam = async (file) => {
        return;
        // return new Promise((resolve, reject) => {
        //     importExamFromXMLtoJSON(file, (err, importedExam) => {
        //         if (err) {
        //             reject(err);
        //         } else {
        //             dispatch(createNewExam(importedExam))
        //             setFileHandle(null); // imported exam is not associated with a file handle
        //             resolve(importedExam);
        //         }
        //     });
        // });
    };

    return { exam, fileHandle, openExam, saveExam, importExam };
}