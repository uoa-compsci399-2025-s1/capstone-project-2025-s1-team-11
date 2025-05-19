import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCoverPage } from "../store/exam/examSlice";
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/examDisplay.jsx";
import { Typography, Button } from "antd";

const Builder = () => {
    const exam = useSelector(selectExamData);
    const coverPage = useSelector((state) => state.exam.coverPage);
    const dispatch = useDispatch();

    const handleUploadClick = () => {
        document.getElementById("cover-upload").click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("Dispatching file:", file.name);
            dispatch(setCoverPage(file));
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <Typography.Title level={2}>Builder</Typography.Title>

            <Typography.Title level={3}>Cover Page</Typography.Title>
            <Button type="default" style={{ marginBottom: 12 }} onClick={handleUploadClick}>
                Upload Cover Page
            </Button>
            <input
                id="cover-upload"
                type="file"
                accept=".docx"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            {coverPage && (
                <p style={{ marginBottom: 24, color: "green" }}>
                    Cover page uploaded: {coverPage.name}
                </p>
            )}

            <Typography.Title level={3}>Questions</Typography.Title>
            <ExamDisplay exam={exam} />
        </div>
    );
};

export default Builder;