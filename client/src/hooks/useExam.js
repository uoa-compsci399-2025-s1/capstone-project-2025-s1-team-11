import { useContext } from "react";
import { ExamContext } from "../context/examContext.js";

export const useExam = () => useContext(ExamContext);