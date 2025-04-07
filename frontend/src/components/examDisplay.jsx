// src/components/ExamDisplay.jsx
import React from 'react';

const ExamDisplay = ({ exam, onAddQuestion }) => {
    if (!exam) {
        return <div>No exam loaded.</div>;
    }
    return (
        <div>
            <h1>{exam.title}</h1>
            <p>Date: {exam.date}</p>
            <h2>Questions:</h2>
            <ul>
                {exam.questions.map((q, idx) => (
                    <li key={q.id || idx}>
                        {q.questionText} (Answer: {q.answer})
                    </li>
                ))}
            </ul>
            <button onClick={onAddQuestion}>Add Question</button>
        </div>
    );
};

export default ExamDisplay;