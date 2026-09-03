import * as fs from 'fs';

async function main() {
  const envFile = fs.readFileSync('.env', 'utf-8');
  let key = '';
  for (const line of envFile.split('\n')) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      key = line.split('=')[1].replace(/"/g, '').trim();
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
