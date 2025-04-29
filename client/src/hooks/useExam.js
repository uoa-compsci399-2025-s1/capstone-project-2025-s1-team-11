import { useContext } from "react";
import { ExamContext } from "../context/examContext.jsx";

export function useExam() {
  return useContext(ExamContext); // will return undefined if ExamContext itself is undefined
}