// src/context/examContext.jsx
import React, { useState, createContext } from "react";
export const ExamContext = createContext(null);

// Only fileHandle is managed here
export const ExamProvider = ({ children }) => {
  const [fileHandle, setFileHandle] = useState(null);

    const setExam = (newExam) => {
        console.log("setExam was called with:", newExam); // 👈 Add this line
      
        if (newExam === null || typeof newExam !== "object") {
          console.error("Invalid exam object.");
          return;
        }
      
        _setExam(newExam);
      };

    return (
        <ExamContext.Provider value={{ exam, setExam, fileHandle, setFileHandle }}>
            {children}
        </ExamContext.Provider>
    );

    //Unsure
  return (
    <ExamContext.Provider value={{ fileHandle, setFileHandle }}>
      {children}
    </ExamContext.Provider>
  );
};