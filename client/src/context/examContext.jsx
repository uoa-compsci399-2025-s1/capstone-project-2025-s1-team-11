// src/context/examContext.jsx
import React, { useState } from "react";
import { ExamContext } from "./ExamContext";

// Only fileHandle is managed here
export const ExamProvider = ({ children }) => {
  const [fileHandle, setFileHandle] = useState(null);

  return (
    <ExamContext.Provider value={{ fileHandle, setFileHandle }}>
      {children}
    </ExamContext.Provider>
  );
};