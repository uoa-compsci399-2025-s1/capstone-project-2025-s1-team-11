// Test script to verify the image sizing fix
import { parseDocx } from './docxParser.js';

/**
 * Test function to verify that multiple instances of the same image
 * with different dimensions are handled correctly
 */
export async function testImageSizingFix(docxFile) {
  console.log('Testing DOCX image sizing fix...');
  
  try {
    const dto = await parseDocx(docxFile);
    
    // Track images found and their dimensions
    const imageInstances = [];
    
    // Helper function to extract images from content
    const extractImagesFromContent = (content, location) => {
      if (!content) return;
      
      const imgMatches = content.match(/<img[^>]*>/g);
      if (imgMatches) {
        imgMatches.forEach((imgTag, index) => {
          const srcMatch = imgTag.match(/src="([^"]*)"/);
          const widthMatch = imgTag.match(/width="([^"]*)"/);
          const heightMatch = imgTag.match(/height="([^"]*)"/);
          const altMatch = imgTag.match(/alt="([^"]*)"/);
          
          imageInstances.push({
            location: `${location}_${index}`,
            src: srcMatch ? srcMatch[1] : 'unknown',
            width: widthMatch ? widthMatch[1] : 'auto',
            height: heightMatch ? heightMatch[1] : 'auto',
            alt: altMatch ? altMatch[1] : 'unknown',
            fullTag: imgTag
          });
        });
      }
    };
    
    // Search through all content in the DTO
    dto.examBody.forEach((item, index) => {
      if (item.type === 'question') {
        extractImagesFromContent(item.contentFormatted, `question_${index}`);
        
        if (item.answers) {
          item.answers.forEach((answer, answerIndex) => {
            extractImagesFromContent(answer.contentFormatted, `question_${index}_answer_${answerIndex}`);
          });
        }
      } else if (item.type === 'section') {
        extractImagesFromContent(item.contentFormatted, `section_${index}`);
        
        if (item.questions) {
          item.questions.forEach((question, questionIndex) => {
            extractImagesFromContent(question.contentFormatted, `section_${index}_question_${questionIndex}`);
            
            if (question.answers) {
              question.answers.forEach((answer, answerIndex) => {
                extractImagesFromContent(answer.contentFormatted, `section_${index}_question_${questionIndex}_answer_${answerIndex}`);
              });
            }
          });
        }
      }
    });
    
    console.log(`Found ${imageInstances.length} image instances:`);
    
    // Group by alt text (filename) to see if same images have different dimensions
    const imagesByFilename = {};
    imageInstances.forEach(img => {
      if (!imagesByFilename[img.alt]) {
        imagesByFilename[img.alt] = [];
      }
      imagesByFilename[img.alt].push(img);
    });
    
    // Report findings
    Object.entries(imagesByFilename).forEach(([filename, instances]) => {
      console.log(`\nImage "${filename}":`);
      
      const uniqueDimensions = new Set();
      instances.forEach((instance, index) => {
        const dimensionKey = `${instance.width}x${instance.height}`;
        uniqueDimensions.add(dimensionKey);
        
        console.log(`  Instance ${index + 1} (${instance.location}): ${dimensionKey}`);
      });
      
      if (uniqueDimensions.size > 1) {
        console.log(`  ✅ SUCCESS: Found ${uniqueDimensions.size} different dimensions for same image - fix is working!`);
      } else if (instances.length > 1) {
        console.log(`  ⚠️  WARNING: ${instances.length} instances but all have same dimensions`);
      } else {
        console.log(`  ℹ️  INFO: Single instance found`);
      }
    });
    
    return {
      totalImages: imageInstances.length,
      imagesByFilename,
      imageInstances
    };
    
  } catch (error) {
    console.error('Error testing image sizing fix:', error);
    throw error;
  }
}

// Example usage (commented out - uncomment to test with a real file):
// testImageSizingFix(yourDocxFileBuffer).then(results => {
//   console.log('Test completed:', results);
// }); 