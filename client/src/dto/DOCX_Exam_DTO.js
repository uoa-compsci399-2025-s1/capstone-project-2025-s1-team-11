class DocxExamDTO {
    constructor(htmlContent) {
      this.htmlContent = htmlContent;
      this.examData = {
        type: "exam",
        examTitle: "",
        courseCode: "",
        courseName: "",
        semester: "",
        year: "",
        coverPage: null,
        examBody: [],
        appendix: null,
        metadata: []
      };
    }
  
    parse() {
      // Create a DOM parser to work with the HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.htmlContent, "text/html");
      
      // Get all sections from the document (WordSection1, WordSection2, etc.)
      const sections = [];
      for (let i = 1; i <= 20; i++) { // Assuming max 20 sections in the document
        const section = doc.querySelector(`.WordSection${i}`);
        if (section) sections.push(section);
      }
      
    //   if (sections.length === 0) {
    //     throw new Error("No valid Word sections found in the document");
    //   }
      
      // Process each Word section
      let currentExamBodyIndex = 0;

      let inQuestionsSection = true;
      
      for (const section of sections) {
        inQuestionsSection = !inQuestionsSection;
        console.log(`inQuestionsSection ${inQuestionsSection}`);
        const paragraphs = section.querySelectorAll("p");

        // Exmpty section indicates
        if (paragraphs.length === 0) {
            continue;
        }
        
        // Check if this section starts with a section break or question
        //let inQuestionsSection = this.isStartOfSection(paragraphs[0]);
        
        if (inQuestionsSection) {
          // Process as a section
          console.log(`processing exambodyindex ${currentExamBodyIndex} as q's in section`);
          currentExamBodyIndex = this.processSection(paragraphs, currentExamBodyIndex);
        } else {
          // Process as questions directly in the exam body
          console.log(`processing exambodyindex ${currentExamBodyIndex} as q's in exambody`);
          currentExamBodyIndex = this.processQuestionsInExamBody(paragraphs, currentExamBodyIndex);
        }
      }
      
      return this.examData;
    }

    sectionIsEmpty() {

    }

    
    processSection(paragraphs, currentIndex) {
        let p0 = this.getOuterHTML(paragraphs[0]);
        let i = 1;// Start from the next paragraph after section header

        if (p0.textContent && this.isStartOfQuestion(p0)) {
            p0 = ''; //only store first paragraph as section content if no '[# mark(s)]'
            i = 0;
        }

        const sectionObj = {
        type: "section",
        contentFormatted: p0,
        format: "HTML",
        pageBreakAfter: false,
        questions: []
        };
        
        while (i < paragraphs.length) {
        // Check if we've hit a question
        if (this.isStartOfQuestion(paragraphs[i])) {
            const { questionObj, nextIndex } = this.extractQuestion(paragraphs, i);
            sectionObj.questions.push(questionObj);
            i = nextIndex;
        } else if (this.isEmptyParagraph(paragraphs[i])) {
            // Skip empty paragraphs
            i++;
        } else {
            // Add content to section
            sectionObj.contentFormatted += this.getOuterHTML(paragraphs[i]);
            i++;
        }
        }
      
      this.examData.examBody[currentIndex] = sectionObj;
      return currentIndex + 1;
    }
    
    processQuestionsInExamBody(paragraphs, currentIndex) {
      let i = 0;
      
      while (i < paragraphs.length) {
        if (this.isStartOfQuestion(paragraphs[i])) {
          const { questionObj, nextIndex } = this.extractQuestion(paragraphs, i);
          this.examData.examBody[currentIndex] = questionObj;
          currentIndex++;
          i = nextIndex;
        } else if (this.isEmptyParagraph(paragraphs[i])) {
          // Skip empty paragraphs
          i++;
        } else {
          // It's possible we have content that doesn't fit our pattern
          // You might want to handle this case, for now we'll just skip
          i++;
        }
      }
      
      return currentIndex;
    }
    
    isStartOfQuestion(paragraph) {
      // Logic to determine if a paragraph is the start of a question
      if (!paragraph.textContent) return false;
      const text = paragraph.textContent.trim();
      return text.startsWith("Question") || 
             /\[\d+\s*mark[s]?\]/.test(text) ||
             text.includes("?");
    }
    
    isEmptyParagraph(paragraph) {
      return paragraph.textContent.trim() === "";
    }
    
    extractQuestion(paragraphs, startIndex) {
      const questionObj = {
        type: "question",
        contentFormatted: this.getOuterHTML(paragraphs[startIndex]),
        format: "HTML",
        pageBreakAfter: false,
        marks: this.extractMarks(paragraphs[startIndex].textContent),
        answers: []
      };
      
      let i = startIndex + 1;
      let answerStartIndex = -1;
      
      // Find where answers start
      while (i < paragraphs.length) {
        if (this.isEmptyParagraph(paragraphs[i])) {
          i++;
          continue;
        }
        
        // If we find another question
        if (this.isStartOfQuestion(paragraphs[i])) {
          break;
        }
        
        // Add to question content until we hit answers
        if (answerStartIndex === -1) {
          // Check if this paragraph is likely an answer
          if (this.isLikelyAnswer(paragraphs[i])) {
            answerStartIndex = i;
          } else {
            // Still part of the question
            questionObj.contentFormatted += this.getOuterHTML(paragraphs[i]);
          }
        }
        
        if (answerStartIndex !== -1) {
          // We're in the answers section
          questionObj.answers.push({
            type: "answer",
            contentFormatted: this.getOuterHTML(paragraphs[i]),
            format: "HTML"
          });
        }
        
        i++;
        
        // Check for double paragraph breaks which mark end of a question
        if (i < paragraphs.length - 1 && 
            this.isEmptyParagraph(paragraphs[i]) && 
            this.isEmptyParagraph(paragraphs[i+1])) {
          i += 2; // Skip both empty paragraphs
          break;
        }
      }
      
      // If no answers were found, check if we missed them
      if (questionObj.answers.length === 0 && answerStartIndex === -1) {
        // Try to detect answers in a different way
        // This is a fallback and might need to be adjusted
        for (let j = startIndex + 1; j < i && j < paragraphs.length; j++) {
          if (!this.isEmptyParagraph(paragraphs[j]) && 
              this.isShortParagraph(paragraphs[j])) {
            questionObj.answers.push({
              type: "answer",
              contentFormatted: this.getOuterHTML(paragraphs[j]),
              format: "HTML"
            });
          }
        }
      }
      
      // Mark the first answer as correct (placeholder - you might want to determine this differently)
      if (questionObj.answers.length > 0) {
        questionObj.answers[0].correct = true;
      }
      
      return { questionObj, nextIndex: i };
    }
    
    isLikelyAnswer(paragraph) {
      // Logic to determine if a paragraph is likely an answer
      // This is a simplified check - you may need to enhance this
      const text = paragraph.textContent.trim();
      return text.startsWith("Answer") || 
             (text.length < 100 && !text.includes("?")) || // Short text without a question mark
             /^[A-D]\./.test(text); // Starts with A., B., etc.
    }
    
    isShortParagraph(paragraph) {
      return paragraph.textContent.trim().length < 100;
    }

    // containsMarksPattern(text) {
    //     const regex = /\[\d+ mark(s)?\]/i;
    //     return regex.test(html);
    // }
    
    extractMarks(text) {
      // Extract marks from question text like [2 marks]
      const marksMatch = text.match(/\[(\d+)\s*mark[s]?\]/);
      return marksMatch ? parseInt(marksMatch[1], 10) : 1; // Default to 1 mark if not specified
    }
    
    getOuterHTML(element) {
      return element.outerHTML || "";
    }
  }
  
  // Example usage:
  function parseExamDocx(htmlContent) {
    const dto = new DocxExamDTO(htmlContent);
    return dto.parse();
  }
  
  // Export for use in your application
  export { DocxExamDTO, parseExamDocx };