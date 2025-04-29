import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

// HTML cleaner — converts very basic tags to docx TextRuns, supports <b>, <i>, <p>.
function parseSimpleHtml(htmlText) {
    const container = document.createElement("div");
    container.innerHTML = htmlText || "";

    const runs = [];

    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim()) {
                runs.push(new TextRun(node.textContent));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            switch (node.tagName.toLowerCase()) {
                case "b":
                    runs.push(new TextRun({ text: node.textContent, bold: true }));
                    break;
                case "i":
                    runs.push(new TextRun({ text: node.textContent, italics: true }));
                    break;
                case "p":
                    runs.push(new TextRun({ text: node.textContent, break: 1 }));
                    break;
                default:
                    walkChildren(node);
            }
        }
    }

    function walkChildren(parent) {
        Array.from(parent.childNodes).forEach(child => walk(child));
    }

    walkChildren(container);
    return runs.length ? runs : [new TextRun("")];
}

// Main export function
export async function exportExamToDocx(examData) {
    if (!examData) {
        console.error("No exam data available for export.");
        return;
    }

    const doc = new Document();

    const content = [
        new Paragraph({
            children: [new TextRun({ text: examData.examTitle || "Exam Title", bold: true, size: 32 })],
        }),
        new Paragraph({
            children: [new TextRun(`${examData.courseCode || ""} - ${examData.courseName || ""}`)],
        }),
        new Paragraph({
            children: [new TextRun(`Semester ${examData.semester || ""}, ${examData.year || ""}`)],
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }), // Spacer
    ];

    // Process each item in the exam body
    examData.examBody.forEach((item, idx) => {
        if (item.type === "section") {
            content.push(new Paragraph({
                text: item.sectionTitle || `Section ${idx + 1}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }));

            // Process questions in section
            (item.questions || []).forEach((question, qIdx) => {
                // Get question text from either questionText or contentText
                const questionText = question.questionText || question.contentText || `Question ${qIdx + 1}`;

                content.push(
                    new Paragraph({
                        children: parseSimpleHtml(questionText),
                        spacing: { before: 200 }
                    })
                );

                // Process answers
                (question.answers || []).forEach((ans, ansIdx) => {
                    content.push(new Paragraph({
                        text: `${String.fromCharCode(65 + ansIdx)}) ${ans.contentText || ""}`,
                        bullet: { level: 0 }
                    }));
                });

                content.push(new Paragraph({ text: "", spacing: { after: 100 } })); // Spacer between questions
            });

        } else if (item.type === "question") {
            // Get question text from either questionText or contentText
            const questionText = item.questionText || item.contentText || `Question ${idx + 1}`;

            content.push(
                new Paragraph({
                    children: parseSimpleHtml(questionText),
                    spacing: { before: 200 }
                })
            );

            // Process answers
            (item.answers || []).forEach((ans, ansIdx) => {
                content.push(new Paragraph({
                    text: `${String.fromCharCode(65 + ansIdx)}) ${ans.contentText || ""}`,
                    bullet: { level: 0 }
                }));
            });

            content.push(new Paragraph({ text: "", spacing: { after: 100 } })); // Spacer
        }
    });

    doc.addSection({
        children: content,
    });

    const blob = await Packer.toBlob(doc);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (examData.examTitle || "exported_exam") + ".docx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true; // Return success
}