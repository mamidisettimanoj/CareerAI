const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const classesToRemove = [
  'glass-panel-hover',
  'glass-panel',
  'text-gradient',
  'glow-primary',
  'glow-accent'
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  classesToRemove.forEach(cls => {
    // Replace class string and handle spaces around it
    const regex = new RegExp(`\\b${cls}\\b\\s*`, 'g');
    content = content.replace(regex, '');
  });

  // Cleanup potential empty className="..."
  content = content.replace(/className="\s*"/g, '');
  content = content.replace(/className='\s*'/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      replaceInFile(filePath);
    }
  });
}

processDirectory(directoryPath);
console.log('Done.');
