import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCoverPage } from "../store/exam/examSlice";
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/builder/examDisplay.jsx";
import { EmptyExam } from "../components/shared/emptyExam.jsx";
import { Typography, Button, Divider} from "antd";
import ExamFileManager from "../components/builder/ExamContentManager.jsx";

const { Title} = Typography;

const Builder = () => {
    const exam = useSelector(selectExamData);
    const coverPage = useSelector((state) => state.exam.coverPage);
    const dispatch = useDispatch();

    const handleUploadCoverPageClick = () => {
        document.getElementById("cover-upload").click();
    };

    const handleCoverPageFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Read the file as ArrayBuffer
                const arrayBuffer = await file.arrayBuffer();
                
                // Convert ArrayBuffer to base64 for serialization (in chunks to avoid call stack overflow)
                const uint8Array = new Uint8Array(arrayBuffer);
                let binaryString = '';
                const chunkSize = 0x8000; // 32KB chunks
                
                for (let i = 0; i < uint8Array.length; i += chunkSize) {
                    const chunk = uint8Array.subarray(i, i + chunkSize);
                    binaryString += String.fromCharCode(...chunk);
                }
                
                const base64String = btoa(binaryString);
                
                // Create a serializable cover page object
                const coverPageData = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    content: base64String // Store as base64 string for serialization
                };
                
                //console.log("Dispatching processed cover page:", coverPageData.name);
                dispatch(setCoverPage(coverPageData));
            } catch (error) {
                console.error("Error processing cover page file:", error);
                // Could add user notification here
            }
        }
    };


    return (
        <>
            <Title level={1}>MCQ Builder</Title>
            <Divider />

            <div>
                        <Typography.Title level={3}>Cover Page</Typography.Title>
                        <Button
                        type="default"
                        style={{ marginBottom: 12 }}
                        onClick={handleUploadCoverPageClick}
                        disabled={!exam}
                        >
                            Upload Cover Page
                        </Button>
                        <input
                            id="cover-upload"
                            type="file"
                            accept=".docx"
                            style={{ display: "none" }}
                            onChange={handleCoverPageFileChange}
                        />
                        {coverPage && (
                            <p style={{ marginBottom: 24, color: "green" }}>
                                Cover page uploaded: {coverPage.name}
                            </p>
                        )}
                    </div>

            <Divider />

            {/* MCQ Exam Questions Section */}
            <div style={{ marginTop: '24px' }}>
                <Typography.Title level={2}>Questions</Typography.Title>
                {exam
                    ? <ExamDisplay exam={exam} />
                    : <EmptyExam />}
            </div>
            <div style={{padding: "40px 0 20px 0"}}>
              <ExamFileManager />
            </div>
        </>
    );
};

export default Builder;