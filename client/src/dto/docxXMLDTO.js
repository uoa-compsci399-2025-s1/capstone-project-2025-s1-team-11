// src/dto/docxXMLDTO.js

/**
 * Walks the parsed XML docx structure and builds a DTO.
 * Uses bookmarks, soft/hard breaks, image detection, and section grouping.
 *
 * @param {object} doc - Parsed document.xml
 * @param {object} rels - Parsed document.xml.rels
 * @param {import('jszip')} zip - JSZip instance for image extraction
 * @returns {Promise<object>} JSON DTO
 */
export async function buildDocxDTOFromXml(doc, rels, zip) {
    const body = doc["w:document"]["w:body"]["w:p"] || [];
    const relationships = rels["Relationships"]["Relationship"] || [];
    const relMap = Object.fromEntries(
        relationships.map((r) => [r["@_Id"], r["@_Target"]])
    );

    const examBody = [];
    let currentSection = null;
    let sectionContent = [];

    let currentQuestion = null;
    let inQuestion = false;
    let sawQuestionText = false;

    for (const p of body) {
        // 1) Detect section break
        const isSectionBreak = !!p["w:pPr"]?.["w:sectPr"];
        if (isSectionBreak) {
            if (currentQuestion) {
                finalizeXmlQuestion(currentQuestion);
                if (!currentSection) {
                    currentSection = {
                        type: "section",
                        sectionTitle: null,
                        content: "",
                        questions: [],
                    };
                }
                currentSection.questions.push(currentQuestion);
                currentQuestion = null;
            }
            if (currentSection) {
                currentSection.content = sectionContent.join("");
                examBody.push(currentSection);
            }
            currentSection = {
                type: "section",
                sectionTitle: null,
                content: "",
                questions: [],
            };
            sectionContent = [];
            inQuestion = false;
            sawQuestionText = false;
            continue;
        }

        // 2) Extract inline image if any
        const imgTag = await extractImageFromParagraph(p, relMap, zip);

        // 3) Extract text + <br> markers
        const runs = Array.isArray(p["w:r"])
            ? p["w:r"]
            : p["w:r"]
                ? [p["w:r"]]
                : [];
        const extractText = (r) => {
            if (!r) return "";
            const parts = [];
            if (r["w:t"]) {
                parts.push(
                    typeof r["w:t"] === "string" ? r["w:t"] : r["w:t"]["#text"]
                );
            }
            if ("w:br" in r) {
                parts.push("<br>");
            }
            return parts.join("");
        };
        const rawText = runs.map(extractText).join("").trim();
        const html = rawText ? `<p>${rawText}</p>` : null;

        // 4) Detect question start by bookmark or “[n mark]”
        const isBookmark = !!p["w:bookmarkStart"];
        const markMatch = rawText.match(/\[(\d+)\s*mark/i);
        const isQuestionStart = isBookmark || !!markMatch;

        if (isQuestionStart) {
            if (currentQuestion) {
                finalizeXmlQuestion(currentQuestion);
                if (!currentSection) {
                    currentSection = {
                        type: "section",
                        sectionTitle: null,
                        content: "",
                        questions: [],
                    };
                }
                currentSection.questions.push(currentQuestion);
            }

            const marks = markMatch ? parseInt(markMatch[1], 10) : 1;
            currentQuestion = {
                type: "question",
                questionText: "",
                supplementalHtml: "",
                marks,
                answers: [],
                correctAnswers: [],
            };
            inQuestion = true;
            sawQuestionText = false;
        }

        // 5) Route into question or section
        if (inQuestion) {
            if (!sawQuestionText) {
                if (imgTag) {
                    currentQuestion.supplementalHtml += imgTag;
                } else if (html) {
                    currentQuestion.questionText = html;
                    sawQuestionText = true;
                }
            } else {
                if (imgTag) {
                    currentQuestion.answers.push(imgTag);
                } else if (html) {
                    currentQuestion.answers.push(html);
                }
            }
        } else {
            if (imgTag) {
                sectionContent.push(imgTag);
            } else if (html) {
                sectionContent.push(html);
            }
        }
    }

    // 6) Finalize last question & section
    if (currentQuestion) {
        finalizeXmlQuestion(currentQuestion);
        if (!currentSection) {
            currentSection = {
                type: "section",
                sectionTitle: null,
                content: "",
                questions: [],
            };
        }
        currentSection.questions.push(currentQuestion);
    }

    if (currentSection) {
        currentSection.content = sectionContent.join("");
        examBody.push(currentSection);
    }

    return {
        title: "Imported DOCX Exam",
        date: new Date().toISOString().split("T")[0],
        examBody,
    };
}

function finalizeXmlQuestion(q) {
    q.answers = q.answers.slice(0, 5);
    while (q.answers.length < 5) q.answers.push("");
    const lastIdx = q.answers.length - 1;
    const lastLower = q.answers[lastIdx].toLowerCase();
    const allOrNone = /(all|none).*above|none of the options/.test(lastLower);
    q.correctAnswers = q.answers.map((_, i) =>
        allOrNone ? i === lastIdx : i === 0 ? 1 : 0
    );
}

async function extractImageFromParagraph(p, relMap, zip) {
    const drawing = p["w:r"]?.["w:drawing"] ?? p["w:drawing"];
    const blip =
        drawing?.["wp:inline"]?.["a:graphic"]?.["a:graphicData"]?.["pic:pic"]?.[
            "pic:blipFill"
            ]?.["a:blip"];
    const rId = blip?.["@_r:embed"];
    if (!rId || !relMap[rId]) return null;

    const imgPath = "word/" + relMap[rId];
    const ext = imgPath.split(".").pop().toLowerCase();
    const mime =
        ext === "png"
            ? "image/png"
            : ext === "jpg" || ext === "jpeg"
                ? "image/jpeg"
                : "application/octet-stream";
    const base64 = await zip.file(imgPath).async("base64");
    return `<img src="data:${mime};base64,${base64}" alt="Embedded image"/>`;
}