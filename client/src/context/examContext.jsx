// src/context/examContext.jsx
import React, { createContext, useContext, useState } from "react";
import Exam from "../models/Exam.js"; // Make sure to import your Exam class

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
    const [exam, _setExam] = useState(null);
    const [fileHandle, setFileHandle] = useState(null);

    const setExam = (newExam) => {
        if (newExam !== null && !(newExam instanceof Exam)) {
            console.error("Invalid exam object. It must be an instance of the Exam class.");
            return;
        }
        _setExam(newExam);
    };

    return (
        <ExamContext.Provider value={{ exam, setExam, fileHandle, setFileHandle }}>
            {children}
        </ExamContext.Provider>
    );
};

export const useExam = () => useContext(ExamContext);