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

// Main export function - fronted call this

export async function exportExamToDocx(examData) {          // frontend call this
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

    examData.examBody.forEach(item => {
        if (item.type === "section") {
            content.push(new Paragraph({
                text: item.sectionTitle || "Untitled Section",
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }));

            item.questions.forEach(question => {
                content.push(
                    new Paragraph({ children: parseSimpleHtml(question.questionText) })
                );
                question.answers.forEach((ans, idx) => {
                    content.push(new Paragraph({
                        text: `${String.fromCharCode(65 + idx)}) ${ans.contentText}`,
                        bullet: { level: 0 }
                    }));
                });
                content.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer between questions
            });

        } else if (item.type === "question") {
            content.push(
                new Paragraph({ children: parseSimpleHtml(item.questionText) })
            );
            item.answers.forEach((ans, idx) => {
                content.push(new Paragraph({
                    text: `${String.fromCharCode(65 + idx)}) ${ans.contentText}`,
                    bullet: { level: 0 }
                }));
            });
            content.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer
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
}