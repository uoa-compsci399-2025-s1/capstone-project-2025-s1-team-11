/* global process */
import { parseDocx } from '../src/dto/docx/docxParser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the fixtures directory
const fixturesDir = path.join(__dirname, '../src/dto/docx/__tests__/fixtures');

// Function to recursively find all .docx files
function findDocxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip txt-versions directories
      if (item !== 'txt-versions') {
        files.push(...findDocxFiles(fullPath));
      }
    } else if (item.endsWith('.docx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to process a single DOCX file
async function processDocxFile(docxPath) {
  try {
    console.log(`Processing: ${path.relative(fixturesDir, docxPath)}`);
    
    // Generate JSON filename (same location, .json extension)
    const jsonPath = docxPath.replace('.docx', '.json');
    
    // Check if JSON already exists
    if (fs.existsSync(jsonPath)) {
      console.log(`  ⚠️  JSON already exists, skipping: ${path.basename(jsonPath)}`);
      return;
    }
    
    // Read file as buffer for JSZip
    const fileBuffer = fs.readFileSync(docxPath);
    
    // Parse DOCX to DTO
    const { dto, mathRegistry } = await parseDocx(fileBuffer);
    const result = { ...dto, mathRegistry };
    
    // Write JSON file
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    
    console.log(`  ✅ Generated: ${path.basename(jsonPath)}`);
    
    // Log some basic stats
    const examBodyCount = result.examBody?.length || 0;
    const questionCount = result.examBody?.filter(item => item.type === 'question').length || 0;
    const sectionCount = result.examBody?.filter(item => item.type === 'section').length || 0;
    
    console.log(`     📊 Stats: ${examBodyCount} items (${questionCount} questions, ${sectionCount} sections)`);
    
  } catch (error) {
    console.error(`  ❌ Error processing ${path.basename(docxPath)}:`, error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting DOCX to JSON fixture generation...\n');
  
  // Find all DOCX files
  const docxFiles = findDocxFiles(fixturesDir);
  
  if (docxFiles.length === 0) {
    console.log('No DOCX files found in fixtures directory.');
    return;
  }
  
  console.log(`Found ${docxFiles.length} DOCX files:\n`);
  
  // Process each file
  for (const docxFile of docxFiles) {
    await processDocxFile(docxFile);
    console.log(); // Empty line for readability
  }
  
  console.log('✨ Fixture generation complete!');
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 