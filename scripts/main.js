import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateQuote } from './generate-quote.js';
import { generateImage } from './generate-image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const docsQuotesPath = path.join(rootDir, 'docs', 'quotes.json');
const imagesDir = path.join(rootDir, 'docs', 'images');

function ensureDirectories() {
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const docsDir = path.dirname(docsQuotesPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
}

function loadQuotes() {
  if (fs.existsSync(docsQuotesPath)) {
    const json = fs.readFileSync(docsQuotesPath, 'utf-8');
    if (json.trim() === '') return [];
    try {
      const data = JSON.parse(json);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is missing.');
    process.exit(1);
  }

  ensureDirectories();
  const quotes = loadQuotes();

  const nextIdNum = quotes.length + 1;
  const newId = `q-${String(nextIdNum).padStart(3, '0')}`;

  console.log('Generating quote...');
  const quoteData = await generateQuote(apiKey);
  console.log('Quote generated:', quoteData);

  const imageFilename = `${newId}.png`;
  const imageSavePath = path.join(imagesDir, imageFilename);

  console.log('Generating image...');
  await generateImage(apiKey, quoteData.text, imageSavePath);
  console.log('Image saved to:', imageSavePath);

  const newRecord = {
    id: newId,
    text: quoteData.text,
    english: quoteData.english,
    author: quoteData.author,
    author_en: quoteData.author_en,
    image_path: `images/${imageFilename}`
  };

  quotes.push(newRecord);

  const jsonContent = JSON.stringify(quotes, null, 2) + '\n';
  fs.writeFileSync(docsQuotesPath, jsonContent, 'utf-8');

  console.log(`Successfully added new quote ID ${newId}`);
}

main().catch((err) => {
  console.error('Execution failed:', err);
  process.exit(1);
});
