import {Empty} from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { selectExamData } from "../../store/exam/selectors.js";

export const EmptyExam = () => {
    const exam = useSelector(selectExamData);
    
    return (
        !exam ? (
            <Empty description="Please open or create an exam in Builder..."/>
        ) : !exam.examBody?.length ? (
            <Empty description="Please import or add questions in Builder..."/>
        ) : null
    );
};