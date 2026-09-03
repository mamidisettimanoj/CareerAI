import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

async function main() {
  console.log('Testing Gemini connection...');
  // Read key from .env
  const envFile = fs.readFileSync('.env', 'utf-8');
  let key = '';
  for (const line of envFile.split('\n')) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      key = line.split('=')[1].replace(/"/g, '').trim();
    }
  }
  
  if (!key) {
    console.error('No GEMINI_API_KEY found');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent('Say "Hello World, Gemini is working!"');
    console.log('Gemini Live Verification PASS');
    console.log('Response content:', result.response.text());
  } catch (error) {
    console.error('Gemini Live Verification FAILED');
    console.error(error);
  }
}

main();
