// src/hooks/useFileSystem.js
import { useDispatch, useSelector } from 'react-redux';
import { createNewExam } from '../store/exam/examSlice';
import { selectExamData } from '../store/exam/selectors';
import { openExamFile, saveExamToFile } from '../services/fileSystemAccess.js';
import { MoodleXmlDTO } from '../dto/moodleXmlDTO.js';
import { convertMoodleXmlDTOToJson } from '../utilities/convertMoodleXmlToJson.js';
// import { importExamFromXMLtoJSON } from '../services/xmlToJsonExamImporter.js'; // or examImportService

import { useState } from 'react'; // for local fileHandle if not stored in Redux



export function useFileSystem() {
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

    // Imports the exam from an XML file and saves it as JSON
    const importExam = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    // Parse XML to DTO
                    const xmlString = event.target.result;
                    const moodleXmlDTO = MoodleXmlDTO.fromXML(xmlString);
                    
                    // Convert to JSON
                    const jsonData = convertMoodleXmlDTOToJson(moodleXmlDTO);
                    
                    // Save as JSON file
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: "imported_exam.json",
                        types: [{
                            description: "JSON Exam Files",
                            accept: { "application/json": [".json"] },
                        }],
                    });
                    
                    const writable = await fileHandle.createWritable();
                    await writable.write(JSON.stringify(jsonData, null, 2));
                    await writable.close();
                    
                    resolve(fileHandle);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    };

    return { exam, fileHandle, openExam, saveExam, importExam };
}