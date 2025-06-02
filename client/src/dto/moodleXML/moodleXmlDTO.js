export class MoodleXmlDTO {
    constructor(questions) {
        this.questions = questions; // Array of QuestionXmlDTO
    }

    // Parse an XML string and return a MoodleXmlDTO instance
    static fromXML(xmlString) {
        // console.log("=== Starting XML parsing ===");
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "application/xml");
        const quizElem = doc.getElementsByTagName("quiz")[0];
        if (!quizElem) {
            console.error("No quiz element found!");
            throw new Error("Invalid XML: missing <quiz> element");
        }
        
        const questionElems = quizElem.getElementsByTagName("question");
        // console.log(`Found ${questionElems.length} question elements in XML`);
        
        const questions = [];
        Array.from(questionElems).forEach((elem, index) => {
            // console.log(`\n--- Processing question element ${index + 1} ---`);
            // console.log(`Question type: ${elem.getAttribute("type")}`);
            try {
                const question = QuestionXmlDTO.fromXMLElement(elem);
                // console.log(`Successfully parsed question: ${question.name}`);
                questions.push(question);
            } catch (error) {
                console.error(`Failed to parse question ${index + 1}:`, error);
                console.error("Question XML:", elem.outerHTML);
            }
        });
        
        // console.log(`\n=== Parsing complete. ${questions.length} questions successfully parsed ===\n`);
        return new MoodleXmlDTO(questions);
    }
}

export class QuestionXmlDTO {
    constructor(type, name, questionText, generalFeedback, answers, images) {
        this.type = type;           
        this.name = name;           
        this.questionText = questionText;
        this.generalFeedback = generalFeedback;
        this.answers = answers;     
        this.images = images;       
    }

    static fromXMLElement(elem) {
        // console.log("  Parsing question details:");
        const type = elem.getAttribute("type") || "multichoice";
        
        // First, extract all file elements and build a filename-to-base64 map
        const fileMap = new Map();
        const fileElems = elem.getElementsByTagName("file");
        Array.from(fileElems).forEach(fileElem => {
            const fileName = fileElem.getAttribute("name");
            const encoding = fileElem.getAttribute("encoding");
            if (fileName && encoding === "base64") {
                const base64Data = fileElem.textContent.trim();
                // Determine MIME type from file extension
                const mimeType = getMimeTypeFromExtension(fileName);
                const dataUri = `data:${mimeType};base64,${base64Data}`;
                fileMap.set(fileName, dataUri);
                // console.log(`  - Found file: ${fileName} (${base64Data.length} chars)`);
            }
        });
        
        // Name parsing
        const nameElem = elem.getElementsByTagName("name")[0];
        // console.log("  - Name element found:", !!nameElem);
        // if (nameElem) {
        //     console.log("    Name XML:", nameElem.outerHTML);
        // }
        const name = nameElem ? nameElem.getElementsByTagName("text")[0].textContent : "";
        // console.log("  - Parsed name:", name);
        
        // Question text parsing with @@PLUGINFILE@@ replacement
        const questionTextElem = elem.getElementsByTagName("questiontext")[0];
        // console.log("  - Question text element found:", !!questionTextElem);
        // if (questionTextElem) {
        //     console.log("    Question text XML:", questionTextElem.outerHTML);
        // }
        let questionText = questionTextElem ? questionTextElem.getElementsByTagName("text")[0].textContent : "";
        questionText = replacePluginFileReferences(questionText, fileMap);
        // console.log("  - Question text length:", questionText.length);
        
        // General feedback parsing with @@PLUGINFILE@@ replacement
        const generalFeedbackElem = elem.getElementsByTagName("generalfeedback")[0];
        // console.log("  - General feedback element found:", !!generalFeedbackElem);
        let generalFeedback = generalFeedbackElem ? generalFeedbackElem.getElementsByTagName("text")[0].textContent : "";
        generalFeedback = replacePluginFileReferences(generalFeedback, fileMap);
        
        // Answer parsing
        const answerElems = elem.getElementsByTagName("answer");
        // console.log(`  - Found ${answerElems.length} answer elements`);
        const answers = [];
        Array.from(answerElems).forEach((answerElem, index) => {
            // console.log(`    Processing answer ${index + 1}`);
            try {
                const answer = AnswerXmlDTO.fromXMLElement(answerElem, fileMap);
                answers.push(answer);
                // console.log(`    Answer ${index + 1} parsed successfully`);
            } catch (error) {
                console.error(`    Failed to parse answer ${index + 1}:`, error);
                console.error("    Answer XML:", answerElem.outerHTML);
                throw error; // Re-throw to catch in the main parsing
            }
        });

        // Image extraction
        const images = [];
        try {
            const questionImages = extractImages(questionText);
            const feedbackImages = extractImages(generalFeedback);
            images.push(...questionImages, ...feedbackImages);
            // console.log(`  - Extracted ${images.length} images`);
        } catch (error) {
            console.error("  - Failed to extract images:", error);
        }
        
        return new QuestionXmlDTO(type, name, questionText, generalFeedback, answers, images);
    }
}

export class AnswerXmlDTO {
    constructor(fraction, text, feedback, images) {
        this.fraction = fraction;   
        this.text = text;           
        this.feedback = feedback;   
        this.images = images;       
    }

    static fromXMLElement(elem, fileMap = new Map()) {
        // console.log("      Parsing answer details");
        const fraction = parseFloat(elem.getAttribute("fraction") || "0");
        // console.log("      - Answer fraction:", fraction);
        
        const textElem = elem.getElementsByTagName("text")[0];
        // console.log("      - Text element found:", !!textElem);
        if (!textElem) {
            console.error("      - Missing text element in answer");
            console.error("      - Answer XML:", elem.outerHTML);
            throw new Error("Missing text element in answer");
        }
        let text = textElem.textContent;
        text = replacePluginFileReferences(text, fileMap);
        // console.log("      - Answer text length:", text.length);
        
        const feedbackElem = elem.getElementsByTagName("feedback")[0];
        let feedback = feedbackElem ? feedbackElem.getElementsByTagName("text")[0].textContent : "";
        feedback = replacePluginFileReferences(feedback, fileMap);
        
        const images = [];
        const answerImages = extractImages(text);
        const feedbackImages = extractImages(feedback);
        images.push(...answerImages, ...feedbackImages);
        
        return new AnswerXmlDTO(fraction, text, feedback, images);
    }
}

export class ImageDTO {
    constructor(src, alt, width, height) {
        this.src = src;             // Image source (URL or base64 data)
        this.alt = alt;             // Alternative text
        this.width = width;         // Image width
        this.height = height;       // Image height
    }
}

// Helper function to extract images from HTML content
function extractImages(htmlContent) {
    const images = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const imgElements = doc.getElementsByTagName("img");
    
    Array.from(imgElements).forEach(img => {
        images.push(new ImageDTO(
            img.src,
            img.alt,
            img.width,
            img.height
        ));
    });
    
    return images;
}

// Helper function to get MIME type from file extension
function getMimeTypeFromExtension(fileName) {
    const extension = fileName.toLowerCase().split('.').pop();
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon'
    };
    return mimeTypes[extension] || 'image/jpeg'; // Default to JPEG if unknown
}

// Helper function to replace @@PLUGINFILE@@ references with actual data URIs
function replacePluginFileReferences(htmlContent, fileMap) {
    if (!htmlContent || fileMap.size === 0) {
        return htmlContent;
    }
    
    let updatedContent = htmlContent;
    
    // Replace @@PLUGINFILE@@/filename references
    fileMap.forEach((dataUri, fileName) => {
        const pluginFileRef = `@@PLUGINFILE@@/${fileName}`;
        updatedContent = updatedContent.replace(new RegExp(pluginFileRef, 'g'), dataUri);
    });
    
    // Apply default size constraints to images without explicit sizes
    updatedContent = applyDefaultImageSizing(updatedContent);
    
    return updatedContent;
}

// Helper function to apply default size constraints to images
function applyDefaultImageSizing(htmlContent) {
    if (!htmlContent) {
        return htmlContent;
    }
    
    // console.log("=== Applying default image sizing ===");
    // console.log("Input HTML:", htmlContent);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const imgElements = doc.getElementsByTagName("img");
    
    // console.log(`Found ${imgElements.length} img elements`);
    
    let hasChanges = false;
    
    Array.from(imgElements).forEach((img, index) => {
        // console.log(`\n--- Processing image ${index + 1} ---`);
        // console.log("Image src:", img.src?.substring(0, 50) + "...");
        // console.log("Existing width attr:", img.getAttribute('width'));
        // console.log("Existing height attr:", img.getAttribute('height'));
        // console.log("Existing width style:", img.style.width);
        // console.log("Existing height style:", img.style.height);
        
        // Skip if image already has both width and height attributes or styles
        const hasExplicitWidth = img.getAttribute('width') || img.style.width;
        const hasExplicitHeight = img.getAttribute('height') || img.style.height;
        
        if (hasExplicitWidth && hasExplicitHeight) {
            // console.log("Skipping - already has explicit sizing");
            return; // Image already has explicit sizing
        }
        
        // For base64 images, apply default sizing
        if (img.src && img.src.startsWith('data:image')) {
            // console.log("Processing base64 image...");
            // Set a default max width similar to rich text editor
            const maxDefaultWidth = 400; // Max width for imported images
            
            // If no explicit sizing, apply default
            if (!hasExplicitWidth && !hasExplicitHeight) {
                // console.log(`Applying default sizing: ${maxDefaultWidth}px width, auto height`);
                img.setAttribute('width', maxDefaultWidth);
                img.setAttribute('height', 'auto');
                img.style.width = maxDefaultWidth + 'px';
                img.style.height = 'auto';
                hasChanges = true;
            } else if (!hasExplicitWidth) {
                // Has height but no width
                // console.log("Setting width to auto (has height)");
                img.style.width = 'auto';
                hasChanges = true;
            } else if (!hasExplicitHeight) {
                // Has width but no height
                // console.log("Setting height to auto (has width)");
                img.style.height = 'auto';
                hasChanges = true;
            }
        } else {
            // console.log("Skipping - not a base64 image");
        }
    });
    
    // Return the updated HTML if changes were made
    if (hasChanges) {
        const result = doc.body.innerHTML;
        // console.log("=== Image sizing complete - changes made ===");
        // console.log("Output HTML:", result);
        return result;
    }
    
    // console.log("=== Image sizing complete - no changes needed ===");
    return htmlContent;
} 