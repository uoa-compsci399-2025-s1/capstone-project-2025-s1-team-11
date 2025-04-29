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
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    // Helper to check if we need a new page
    const checkPageBreak = (yPos, height = 10) => {
        if (yPos + height > 280) {
            doc.addPage();
            return 20; // Reset to top of new page
        }
        return yPos;
    };

    // Helper for text wrapping
    const addWrappedText = (text, xPos, yPos, fontSize = 12) => {
        doc.setFontSize(fontSize);

        // Split text to fit page width
        const textLines = doc.splitTextToSize(text, contentWidth);

        // Add each line
        textLines.forEach((line, i) => {
            doc.text(line, xPos, yPos + (i * (fontSize * 0.4)));
        });

        // Return new y position
        return yPos + (textLines.length * (fontSize * 0.4));
    };

    // Header
    doc.setFontSize(18);
    doc.text(examData.examTitle || "Exam Title", margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`${examData.courseCode || ""} - ${examData.courseName || ""}`, margin, y);
    y += 7;
    doc.text(`Semester ${examData.semester || ""}, ${examData.year || ""}`, margin, y);
    y += 15;

    // Process exam body
    (examData.examBody || []).forEach((item, idx) => {
        // Check if we need a new page
        y = checkPageBreak(y);

        if (item.type === "section") {
            // Add section title
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(item.sectionTitle || `Section ${idx + 1}`, margin, y);
            doc.setFont(undefined, 'normal');
            y += 10;

            // Process questions in this section
            (item.questions || []).forEach((question, qIdx) => {
                y = checkPageBreak(y);

                // Get question text
                const questionText = question.questionText || question.contentText || `Question ${qIdx + 1}`;

                // Add question number
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`Question ${question.displayNumber || (qIdx + 1)}:`, margin, y);
                doc.setFont(undefined, 'normal');
                y += 7;

                // Add question text with wrapping
                y = addWrappedText(questionText, margin, y);
                y += 5;

                // Process answers
                (question.answers || []).forEach((ans, ansIdx) => {
                    y = checkPageBreak(y);

                    const optionLabel = String.fromCharCode(65 + ansIdx); // A, B, C, etc.
                    const answerText = `${optionLabel}) ${ans.contentText || ""}`;

                    y = addWrappedText(answerText, margin + 5, y);
                    y += 5;
                });

                y += 5; // Space after question
            });
        } else if (item.type === "question") {
            y = checkPageBreak(y);

            // Get question text
            const questionText = item.questionText || item.contentText || `Question ${idx + 1}`;

            // Add question number
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`Question ${item.displayNumber || (idx + 1)}:`, margin, y);
            doc.setFont(undefined, 'normal');
            y += 7;

            // Add question text with wrapping
            y = addWrappedText(questionText, margin, y);
            y += 5;

            // Process answers
            (item.answers || []).forEach((ans, ansIdx) => {
                y = checkPageBreak(y);

                const optionLabel = String.fromCharCode(65 + ansIdx); // A, B, C, etc.
                const answerText = `${optionLabel}) ${ans.contentText || ""}`;

                y = addWrappedText(answerText, margin + 5, y);
                y += 5;
            });

            y += 5; // Space after question
        }
    });

    // Save PDF
    doc.save((examData.examTitle || "exported_exam") + ".pdf");

    return true; // Return success
}