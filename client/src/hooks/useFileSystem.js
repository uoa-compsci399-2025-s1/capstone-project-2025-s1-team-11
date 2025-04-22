// src/hooks/useFileSystem.js
import { useExam } from "./useExam.js";
import { openExamFile, saveExamToFile } from "../services/fileSystemAccess.js";
import { importExamFromXMLtoJSON } from "../services/xmlToJsonExamImporter.js";

export function useFileSystem() {
    const { exam, setExam, fileHandle, setFileHandle } = useExam();

    // Opens the exam file and updates the global state
    const openExam = async () => {
        const result = await openExamFile();
        if (result) {
            setExam(result.exam);
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
    const importExam = async (file) => {
        return new Promise((resolve, reject) => {
            importExamFromXMLtoJSON(file, (err, importedExam) => {
                if (err) {
                    reject(err);
                } else {
                    setExam(importedExam);
                    setFileHandle(null); // imported exam is not associated with a file handle
                    resolve(importedExam);
                }
            });
        });
    };

    return { exam, fileHandle, openExam, saveExam, importExam };
}