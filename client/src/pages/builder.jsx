import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCoverPage } from "../store/exam/examSlice";
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/builder/examDisplay.jsx";
import ExamFileManager from "../components/builder/ExamContentManager.jsx";
import { EmptyExam } from "../components/shared/emptyExam.jsx";
import { Typography, Button, Collapse, Divider} from "antd";
//import { exportExamToPdf } from "../services/exportPdf.js";

const { Title, Paragraph, Text } = Typography;

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
            //console.log("Dispatching file:", file.name);
            dispatch(setCoverPage(file));
        }
    };



    const coverPageItems = [
        {
            key: '1',
            label: 'Cover Page',
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Title level={3}>Cover Page</Title>
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
                        <Paragraph style={{ marginBottom: 24, color: "green" }}>
                            Cover page uploaded: {coverPage.name}
                        </Paragraph>
                    )}
                </div>
            ),
        }
    ];

    return (
        <>
            <Title level={1}>MCQ Builder</Title>
            <Divider />

            {/* Cover Page Section */}
            <Collapse
                defaultActiveKey={[]}
                items={coverPageItems}
                style={{ marginTop: '16px' }}
            />

            <Divider />

            {/* MCQ Exam Questions Section */}
            <div style={{ marginTop: '24px' }}>
                <Title level={3}>MCQ Exam Questions</Title>
                {exam?
                <ExamDisplay
                    exam={exam}
                />
                : <EmptyExam />}
                <ExamFileManager />
            </div>

            <Divider />
        </>
    );
};

export default Builder;