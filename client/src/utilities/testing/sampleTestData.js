/**
 * Sample test data for the Statistics-Histogram feature
 * This provides realistic test data without requiring an external JSON file
 */

export const sampleTestData = {
  exam: {
    title: "CS111 Exam",
    questions: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      text: `Question ${i + 1}`,
      options: [
        { id: "01", text: "Option A" },
        { id: "02", text: "Option B" },
        { id: "04", text: "Option C" },
        { id: "08", text: "Option D" },
        { id: "16", text: "Option E" }
      ]
    }))
  },
  correctAnswers: {
    "11000000004": {
      1: "02", 2: "04", 3: "08", 4: "16", 5: "01",
      6: "02", 7: "04", 8: "08", 9: "16", 10: "01",
      11: "02", 12: "04", 13: "08", 14: "16", 15: "01",
      16: "02", 17: "04", 18: "08", 19: "16", 20: "01"
    }
  },
  // Generate 385 sample student responses
  studentResponses: Array.from({ length: 385 }, (_, i) => {
    // Create a unique student ID
    const studentId = `01${String(100000000 + i).substring(1)}`;
    
    // All students use version 4
    const examVersion = "11000000004";
    
    // Generate answers with a 70% chance of being correct
    const answers = Array.from({ length: 20 }, (_, qIndex) => {
      const correctAnswer = {
        1: "02", 2: "04", 3: "08", 4: "16", 5: "01",
        6: "02", 7: "04", 8: "08", 9: "16", 10: "01",
        11: "02", 12: "04", 13: "08", 14: "16", 15: "01",
        16: "02", 17: "04", 18: "08", 19: "16", 20: "01"
      }[qIndex + 1];
      
      // 70% chance of getting the correct answer
      const isCorrect = Math.random() < 0.7;
      
      if (isCorrect) {
        return correctAnswer;
      } else {
        // Choose a random wrong answer
        const options = ["01", "02", "04", "08", "16"];
        const wrongOptions = options.filter(opt => opt !== correctAnswer);
        return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      }
    });
    
    return {
      studentId,
      examVersion,
      answers
    };
  })
}; 