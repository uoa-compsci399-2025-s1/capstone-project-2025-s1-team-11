// src/pages/ExamFileManager.jsx
import React, { useState} from "react";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";

const Builder = ({  }) => {
    // Unified exam state
    const [exam, setExam] = useState(null);

    // Callback for adding a new question
    const addQuestion = () => {
        if (!exam) return;
        const newId = exam.questions.length + 1;
        const newQuestion = {
            id: newId,
            questionText: `New Question ${newId}`,
            answer: "Answer",
            options: ["1", "2", "3", "4"],
        };
        setExam({ ...exam, questions: [...exam.questions, newQuestion] });
    };

    return (
        <div>
            <h1>MCQ Builder</h1>
            {exam ? (
                <ExamDisplay exam={exam} onAddQuestion={addQuestion} />
            ) : (
                <p>No exam loaded.</p>
            )}
            <ExamFileManager onExamLoaded={setExam} />
        </div>
    );
};

export default Builder;
