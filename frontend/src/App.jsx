// src/App.jsx
import React, { useEffect, useState } from 'react';
import ExamDisplay from './components/ExamDisplay.jsx';
import MCQLayout from './components/Layout';
import DevelopmentWarning from './components/developmentWarning';
import PopupWarning from './components/popupWarning';
import ExamFileManager from "./pages/ExamFileManager.jsx";
import ExamPageFS from "./pages/ExamPageFS.jsx";

const App = () => {
  const [showWarning, setShowWarning] = useState(false);
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
      options: ["1","2","3","4"],
    };
    setExam({ ...exam, questions: [...exam.questions, newQuestion] });
  };

  // Check for non-Chromium browsers
  useEffect(() => {
    const isChromium = !!window.chrome;
    if (!isChromium) {
      setShowWarning(true);
    }
  }, []);

  return (
      <MCQLayout>
        <DevelopmentWarning />
        <PopupWarning visible={showWarning} onClose={() => setShowWarning(false)} />
        <ExamPageFS></ExamPageFS>
        <div>
          {exam ? <ExamDisplay exam={exam} onAddQuestion={addQuestion}/> : <p>No exam loaded.</p>}
          <ExamFileManager onExamLoaded={setExam} />
        </div>
      </MCQLayout>
  );
};

export default App;