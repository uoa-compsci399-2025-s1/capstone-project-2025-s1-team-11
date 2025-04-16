import { useContext } from "react";
import { ExamContext } from "../context/examContext.jsx";

export const useExam = () => useContext(ExamContext);