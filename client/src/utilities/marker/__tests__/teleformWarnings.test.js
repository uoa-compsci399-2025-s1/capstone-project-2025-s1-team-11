import { describe, it, expect } from "@jest/globals";

// Inline version of hasMultipleBitsSet and getMultipleAnswerWarnings for test scope
function hasMultipleBitsSet(value) {
  return value !== 0 && (value & (value - 1)) !== 0;
}

function getMultipleAnswerWarnings(parsedData) {
  const warnings = [];

  parsedData.forEach(({ studentId, answerString }) => {
    const multiAnswerQuestions = [];

    for (let i = 0; i < answerString.length; i += 2) {
      const chunk = answerString.substring(i, i + 2);
      const value = parseInt(chunk, 10);
      const questionNum = i / 2 + 1;

      if (!isNaN(value) && hasMultipleBitsSet(value)) {
        multiAnswerQuestions.push(questionNum);
      }
    }

    if (multiAnswerQuestions.length > 0) {
      warnings.push(
        `Student ${studentId} selected multiple answers for Question(s): ${multiAnswerQuestions.join(', ')}`
      );
    }
  });

  return warnings;
}

describe("getMultipleAnswerWarnings", () => {
  it("returns empty array if no multiple answers are present", () => {
    const parsedData = [
      { studentId: "100000001", answerString: "01".repeat(10) } // All single-bit
    ];
    expect(getMultipleAnswerWarnings(parsedData)).toEqual([]);
  });

  it("detects a single multi-answer question", () => {
    const parsedData = [
      { studentId: "100000002", answerString: "01".repeat(2) + "03" + "01".repeat(7) }
    ];
    expect(getMultipleAnswerWarnings(parsedData)).toEqual([
      "Student 100000002 selected multiple answers for Question(s): 3"
    ]);
  });

  it("groups multiple multi-answer questions for one student", () => {
    const parsedData = [
      { studentId: "100000003", answerString: "01".repeat(1) + "05" + "01".repeat(1) + "06" + "01".repeat(6) }
    ];
    expect(getMultipleAnswerWarnings(parsedData)).toEqual([
      "Student 100000003 selected multiple answers for Question(s): 2, 4"
    ]);
  });

  it("handles multiple students with issues", () => {
    const parsedData = [
      { studentId: "100000004", answerString: "01".repeat(1) + "03" + "01".repeat(8) },
      { studentId: "100000005", answerString: "07" + "01".repeat(9) }
    ];
    expect(getMultipleAnswerWarnings(parsedData)).toEqual([
      "Student 100000004 selected multiple answers for Question(s): 2",
      "Student 100000005 selected multiple answers for Question(s): 1"
    ]);
  });
});