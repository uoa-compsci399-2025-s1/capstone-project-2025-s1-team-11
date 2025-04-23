// src/dto/docxXMLDTO.js

/**
 * Walks the parsed XML docx structure and builds a DTO.
 * Uses bookmarks, soft/hard breaks, and image detection.
 *
 * @param {object} doc - Parsed document.xml
 * @param {object} rels - Parsed document.xml.rels
 * @param {JSZip} zip - Zip instance for image extraction
 * @returns {Promise<object>} JSON DTO
 */
export async function buildDocxDTOFromXml(doc, rels, zip) {
    const body = doc['w:document']['w:body']['w:p'] || [];
    const relationships = rels['Relationships']['Relationship'] || [];
    const relMap = Object.fromEntries(
        relationships.map(r => [r['@_Id'], r['@_Target']])
    );

    const questions = [];
    let currentQuestion = null;
    let buffer = [];

    for (const p of body) {
        const runs = Array.isArray(p['w:r']) ? p['w:r'] : [p['w:r']];
        const text = runs.map(r => (r?.['w:t'] ?? '')).join('').trim();

        const hasBookmark = p['w:bookmarkStart'] || (Array.isArray(p['w:bookmarkStart']) && p['w:bookmarkStart'].length);
        const isLikelyQuestionStart = /^\[\d+ mark/i.test(text);

        if (hasBookmark || isLikelyQuestionStart) {
            if (currentQuestion) {
                finalizeXmlQuestion(currentQuestion, buffer);
                questions.push(currentQuestion);
            }
            currentQuestion = {
                sectionNo: null,
                questionNo: questions.length + 1,
                questionText: '',
                supplementalHtml: '',
                marks: 1,
                answers: [],
                correctAnswers: []
            };
            buffer = [];
        }

        // Extract inline images if present
        const imgTag = await extractImageFromParagraph(p, relMap, zip);
        if (imgTag) {
            buffer.push(imgTag);
            continue;
        }

        if (text) {
            buffer.push(`<p>${text}</p>`);
        }
    }

    if (currentQuestion) {
        finalizeXmlQuestion(currentQuestion, buffer);
        questions.push(currentQuestion);
    }

    return {
        title: 'Imported DOCX Exam',
        date: new Date().toISOString().split('T')[0],
        questions,
    };
}

function finalizeXmlQuestion(question, buffer) {
    question.questionText = buffer[0] || '';
    question.answers = buffer.slice(1, 6);
    while (question.answers.length < 5) {
        question.answers.push('');
    }
    const last = question.answers.length - 1;
    const isAllOrNone = /(all|none).*above/i.test(question.answers[last]);
    question.correctAnswers = question.answers.map((_, i) => (isAllOrNone ? i === last : i === 0 ? 1 : 0));
}

async function extractImageFromParagraph(p, relMap, zip) {
    const drawing = p['w:r']?.['w:drawing'] ?? p['w:drawing'];
    const blip = drawing?.['wp:inline']?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
    const rId = blip?.['@_r:embed'];
    if (!rId || !relMap[rId]) return null;

    const imgPath = 'word/' + relMap[rId];
    const ext = imgPath.split('.').pop();
    const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream';
    const base64 = await zip.file(imgPath).async('base64');

    return `<img src="data:${mime};base64,${base64}" />`;
}
