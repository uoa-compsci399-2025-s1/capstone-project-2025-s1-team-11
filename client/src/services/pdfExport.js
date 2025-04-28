import { jsPDF } from "jspdf";

/**
 * Export exam data to PDF
 */
export function exportExamToPdf(examData) {
    if (!examData) {
        console.error("No exam data available for PDF export.");
        return;
    }

    const doc = new jsPDF();
    let y = 20; // Start vertical position

    // Header
    doc.setFontSize(18);
    doc.text(examData.examTitle || "Exam Title", 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`${examData.courseCode || ""} - ${examData.courseName || ""}`, 10, y);
    y += 7;
    doc.text(`Semester ${examData.semester || ""}, ${examData.year || ""}`, 10, y);
    y += 15;

    // Exam Body
    examData.examBody.forEach(item => {
        if (item.type === "section") {
            doc.setFontSize(14);
            doc.text(item.sectionTitle || "Untitled Section", 10, y);
            y += 10;

            item.questions.forEach(question => {
                y = addQuestionToPdf(doc, question, y);
            });
        } else if (item.type === "question") {
            y = addQuestionToPdf(doc, item, y);
        }
    });

    // Save PDF
    doc.save((examData.examTitle || "exported_exam") + ".pdf");
}

/**
 * Helper to add question and answers to the PDF
 */
function addQuestionToPdf(doc, question, startY) {
    let y = startY;

    doc.setFontSize(12);
    if (y > 270) { // Prevent writing off page
        doc.addPage();
        y = 20;
    }

    doc.text(question.contentText || "Question", 10, y);
    y += 7;

    (question.answers || []).forEach((ans, idx) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        const optionLabel = String.fromCharCode(65 + idx); // A, B, C, etc.
        doc.text(`${optionLabel}) ${ans.contentText || ""}`, 20, y);
        y += 6;
    });

    y += 10; // Space after question
    return y;
}