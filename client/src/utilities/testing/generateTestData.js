import { generateExamTestData, saveTestData } from './examTestDataGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ExcelJS from 'exceljs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates test data from real exam files
 */
async function main() {
  try {
    // Define file paths - updated to match the actual files
    const docxFilePath = path.join(__dirname, '../../resources/CS111.docx');
    const versionsFilePath = path.join(__dirname, '../../resources/Versions.xlsx');
    const teleformFilePath = path.join(__dirname, '../../resources/2010S2_111.txt');
    const outputFilePath = path.join(__dirname, '../../resources/examTestData.json');
    
    //console.log('Generating test data from real exam files...');
    
    // Read files using fs instead of fetch
    const docxFile = fs.readFileSync(docxFilePath);
    const versionsFile = fs.readFileSync(versionsFilePath);
    
    // Generate test data
    const testData = await generateExamTestData(docxFile, versionsFile, teleformFilePath);
    
    // Save the generated data
    saveTestData(testData, outputFilePath);
    
    //console.log('Test data generation complete!');
    //console.log(`JSON data saved to: ${outputFilePath}`);
    
    // You can now use this JSON file in your application for testing
    //console.log('To use this test data:');
    //console.log('1. Load the JSON file in your exam marker component');
    //console.log('2. Use it to simulate real student responses and statistics');
    
  } catch (error) {
    console.error('Error generating test data:', error);
  }
}

// async function readVersionsFile(filePath) {
//   const workbook = new ExcelJS.Workbook();
//   await workbook.xlsx.readFile(filePath);
  
//   const worksheet = workbook.getWorksheet(1);
//   const data = [];
  
//   worksheet.eachRow((row, rowNumber) => {
//     if (rowNumber === 1) return; // Skip header row
    
//     const rowData = {};
//     row.eachCell((cell, colNumber) => {
//       const header = worksheet.getRow(1).getCell(colNumber).value;
//       rowData[header] = cell.value;
//     });
//     data.push(rowData);
//   });
  
//   return data;
// }

// Run the script
main(); 