// src/pages/ExamFileManager.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Table, Card, Space, Typography } from "antd";
import { shuffleAnswers } from "../store/exam/examSlice"; // Your existing reducer
import { selectExamData, selectAllQuestionsFlat } from "../store/exam/selectors";

const { Title, Text } = Typography;

const Randomiser = () => {
    const dispatch = useDispatch();
    const exam = useSelector(selectExamData);
    const questions = useSelector(selectAllQuestionsFlat);
    //const [hasShuffled, setHasShuffled] = useState(false);

    const handleShuffleAnswers = () => {
        if (!exam) {
            console.error("No exam data available to shuffle");
            return;
        }
        
        dispatch(shuffleAnswers()); // Using your existing reducer
        //setHasShuffled(true);
    };

    // Format mapping data for display
    const getShuffleMappingData = () => {
        if (!questions || questions.length === 0) return [];
        
        return questions.map((question) => {
            const { questionNumber, answerShuffleMaps } = question;
            
            if (!answerShuffleMaps || answerShuffleMaps.length === 0) {
                return [{
                    key: `q${questionNumber}-no-shuffle`,
                    questionNumber,
                    version: 'N/A',
                    mapping: 'No shuffle map available',
                    mappingDetails: 'No shuffle map available'
                }];
            }
            
            // Create rows for each version
            return answerShuffleMaps.map((mapping, versionIndex) => ({
                key: `q${questionNumber}-v${versionIndex + 1}`,
                questionNumber,
                version: exam.versions[versionIndex],
                mapping: mapping.join(", "),
                // Create map from original position to shuffled position
                mappingDetails: mapping
                    .map((pos, idx) => `${String.fromCharCode(65 + idx)} → ${String.fromCharCode(65 + pos)}`)
                    .join(", ")
            }));
        }).flat(); // Flatten the nested arrays
    };

    const columns = [
        {
            title: "Question",
            dataIndex: "questionNumber",
            key: "questionNumber",
            sorter: (a, b) => a.questionNumber - b.questionNumber,
        },
        {
            title: "Version",
            dataIndex: "version",
            key: "version",
        },
        {
            title: "Raw Mapping",
            dataIndex: "mapping",
            key: "mapping",
        },
        {
            title: "Position Mapping (Original → Shuffled)",
            dataIndex: "mappingDetails",
            key: "mappingDetails",
        }
    ];

    return (
        <div style={{ padding: "20px" }}>
            <Title level={2}>Answer Randomiser</Title>
            
            <Card style={{ marginBottom: "20px" }}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div>
                        <Text>
                            Shuffle answer options for all questions and versions of the exam.
                            This will randomize the order of answers while respecting any locked positions.
                        </Text>
                    </div>
                    
                    <Button 
                        type="primary" 
                        onClick={handleShuffleAnswers}
                        disabled={!exam}
                    >
                        Shuffle All Answers
                    </Button>
                    
                    {!exam && (
                        <Text type="warning">No exam data available. Please create or load an exam first.</Text>
                    )}
                </Space>
            </Card>
            <Card title="Answer Shuffle Mappings">
                <Text type="secondary" style={{ marginBottom: "16px", display: "block" }}>
                    The table below shows how answer options are mapped after shuffling.
                    For example, "A → C" means that the original option A will appear as option C in the shuffled version.
                </Text>
                <Table 
                    dataSource={getShuffleMappingData()} 
                    columns={columns} 
                    size="small"
                    pagination={{ pageSize: 20 }}
                />
            </Card>
        </div>
    );
};

export default Randomiser;