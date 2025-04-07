// src/pages/ExamFileManager.jsx
import React, { useState } from 'react';
import { openExamFile, saveExamToFile } from '../services/fileSystemAccess.js';
import { importExamFromXMLtoJSON } from '../services/xmlToJsonExamImporter.js';
import {Alert} from 'antd';


const ExamFileManager = ({ onExamLoaded }) => {
    const [exam, setExam] = useState(null);
    const [fileHandle, setFileHandle] = useState(null);
    const [error, setError] = useState('');
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    // Open a JSON exam file
    const handleOpenExam = async () => {
        try {
            const result = await openExamFile();
            if (result) {
                setExam(result.exam);
                setFileHandle(result.fileHandle);
                // Pass the exam back to the parent
                onExamLoaded(result.exam);
            }
        } catch (err) {
            setError("Error opening exam: " + err.message);
        }
    };

    // Import an exam from an XML file
    const handleImportExam = async (event) => {
        const file = event.target.files[0];
        if (file) {
            importExamFromXMLtoJSON(file, (err, importedExam) => {
                if (err) {
                    setError("Error importing exam: " + err.message);
                } else {
                    setError('');
                    setExam(importedExam);
                    setFileHandle(null); // since this exam was imported and not loaded from a JSON file
                    // Pass the imported exam back to the parent
                    onExamLoaded(importedExam);
                }
            });
        }
    };

    // Inside your ExamFileManager.jsx component
    const handleSaveExam = async () => {
        if (!exam) return;
        try {
            // This will either update the existing file or prompt for a save location.
            const updatedHandle = await saveExamToFile(exam, fileHandle);
            setFileHandle(updatedHandle); // Save the handle for future use.
            setShowSuccessAlert(true);
            console.log("File saved successfully to " + fileHandle.name); // Debug log
        } catch (err) {
            setError("Error saving exam: " + err.message);
        }
    };

    return (
        <div>
            <h2>Exam File Manager</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {showSuccessAlert && (
                <Alert
                    message="Success"
                    description="File saved successfully!"
                    type="success"
                    showIcon
                    closable
                    onClose={() => setShowSuccessAlert(false)}
                />
            )}
            <p>
                Currently Editing:{' '}
                {fileHandle ? fileHandle.name : 'No file loaded (unsaved exam)'}
            </p>
            <button onClick={handleOpenExam}>Open Exam (JSON)</button>
            <label style={{ marginLeft: '1rem' }}>
                Import Exam (XML):
                <input
                    type="file"
                    accept=".xml"
                    onChange={handleImportExam}
                    style={{ marginLeft: '0.5rem' }}
                />
            </label>
            <button onClick={handleSaveExam} style={{ marginLeft: '1rem' }}>
                Save Exam
            </button>
        </div>
    );
};

export default ExamFileManager;