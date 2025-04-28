import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { extractDocumentXml } from './utils/extractDocumentXml.js';
import { parseXmlToJson } from './utils/parseXmlToJson.js';
import { transformXmlToSimpleDto } from './transformXmlToSimpleDto.js';

const inputFolder = path.resolve('./docxDTO/inputFiles');
const outputFolder = path.resolve('./docxDTO/outputFiles');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const listInputFiles = async () => {
  const files = await fs.readdir(inputFolder);
  return files.filter(file => file.endsWith('.docx'));
};

/**
 * @param {string[]} files
 * @returns {Promise<string>}
 */
const promptSelectFile = (files) => {
  console.log('Available input files:');
  files.forEach((file, idx) => {
    console.log(`[${idx + 1}] ${file}`);
  });

  return new Promise((resolve) => {
    rl.question('Select a file number: ', (answer) => {
      const index = parseInt(answer.trim(), 10) - 1;
      if (index >= 0 && index < files.length) {
        resolve(files[index]);
      } else {
        console.log('Invalid selection.');
        process.exit(1);
      }
    });
  });
};

const run = async () => {
  try {
    const files = await listInputFiles();
    if (files.length === 0) {
      console.log('No input files found.');
      process.exit(1);
    }

    const selectedFile = await promptSelectFile(files);
    rl.close();

    const inputPath = path.join(inputFolder, selectedFile);

    console.log(`Reading input file: ${selectedFile}`);
    const { documentXml, relationships, imageData } = await extractDocumentXml(inputPath);

    console.log('Parsing document XML...');
    const parsedXml = parseXmlToJson(documentXml);

    console.log('Transforming to DTO...');

    const dto = transformXmlToSimpleDto(parsedXml, relationships, imageData);

    const timestamp = new Date();
    const hhmm = `${timestamp.getHours().toString().padStart(2, '0')}${timestamp.getMinutes().toString().padStart(2, '0')}`;
    const outputFilename = `${path.parse(selectedFile).name}_${hhmm}.json`;
    const outputPath = path.join(outputFolder, outputFilename);

    await fs.writeFile(outputPath, JSON.stringify(dto, null, 2));
    console.log(`✅ Output written to ${outputPath}`);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});