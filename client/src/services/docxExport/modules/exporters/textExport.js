/**
 * Export exam data to a plain text format
 * @param {Object} examData - The exam data object
 * @returns {Promise<Blob>} - A blob containing the text file
 */
export async function exportExamToText(examData) {
    if (!examData) {
        console.error("No exam data available for text export.");
        return null;
    }

    try {
        let textContent = "";

        // Add exam title and info
        textContent += `${examData.examTitle || "Exam"}\n`;
        textContent += `${examData.courseCode || ""} - ${examData.courseName || ""}\n`;
        textContent += `${examData.semester || ""} ${examData.year || ""}\n`;
        textContent += `Version: ${examData.versionNumber || "1"}\n\n`;

        // Process exam body
        examData.examBody.forEach((item, idx) => {
            if (item.type === "section") {
                textContent += `\n## ${item.sectionTitle || `Section ${item.sectionNumber || idx + 1}`}\n\n`;

                // Add section content as plain text
                if (item.contentText) {
                    textContent += `${item.contentText}\n\n`;
                } else if (item.contentFormatted) {
                    textContent += `${convertHtmlToText(item.contentFormatted)}\n\n`;
                }

                // Process questions in section
                (item.questions || []).forEach((question, qIdx) => {
                    const questionNumber = question.questionNumber || qIdx + 1;
                    const marks = question.marks ? ` [${question.marks} mark${question.marks > 1 ? 's' : ''}]` : '';

                    textContent += `${questionNumber}. ${marks}\n`;

                    if (question.contentText) {
                        textContent += `${question.contentText}\n\n`;
                    } else if (question.contentFormatted) {
                        textContent += `${convertHtmlToText(question.contentFormatted)}\n\n`;
                    }

                    // Process answers
                    (question.answers || []).forEach((ans, ansIdx) => {
                        const optionLetter = String.fromCharCode(65 + ansIdx);

                        if (ans.contentText) {
                            textContent += `   ${optionLetter}) ${ans.contentText}\n`;
                        } else if (ans.contentFormatted) {
                            textContent += `   ${optionLetter}) ${convertHtmlToText(ans.contentFormatted)}\n`;
                        } else {
                            textContent += `   ${optionLetter}) \n`;
                        }
                    });

                    textContent += "\n";
                });
            } else if (item.type === "question") {
                const questionNumber = item.questionNumber || idx + 1;
                const marks = item.marks ? ` [${item.marks} mark${item.marks > 1 ? 's' : ''}]` : '';

                textContent += `${questionNumber}. ${marks}\n`;

                if (item.contentText) {
                    textContent += `${item.contentText}\n\n`;
                } else if (item.contentFormatted) {
                    textContent += `${convertHtmlToText(item.contentFormatted)}\n\n`;
                }

                // Process answers
                (item.answers || []).forEach((ans, ansIdx) => {
                    const optionLetter = String.fromCharCode(65 + ansIdx);

                    if (ans.contentText) {
                        textContent += `   ${optionLetter}) ${ans.contentText}\n`;
                    } else if (ans.contentFormatted) {
                        textContent += `   ${optionLetter}) ${convertHtmlToText(ans.contentFormatted)}\n`;
                    } else {
                        textContent += `   ${optionLetter}) \n`;
                    }
                });

                textContent += "\n";
            }
        });

        // Create a text file blob
        const blob = new Blob([textContent], { type: 'text/plain' });
        return blob;
    } catch (error) {
        console.error("Error generating text file:", error);
        throw error;
    }
}

/**
 * Convert HTML content to plain text
 * @param {string} html - HTML content
 * @returns {string} - Plain text content
 */
function convertHtmlToText(html) {
    // Create temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Replace common HTML elements with text equivalents
    const elements = temp.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li');
    elements.forEach(el => {
        // Add newlines after block elements
        el.insertAdjacentText('afterend', '\n');
    });

    // Replace <br> with newlines
    const brs = temp.querySelectorAll('br');
    brs.forEach(br => {
        br.insertAdjacentText('afterend', '\n');
    });

    // Return text content
    return temp.textContent || temp.innerText || '';
}