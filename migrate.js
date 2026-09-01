import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');
const appDir = path.join(process.cwd(), 'src', 'app');

if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

const files = fs.readdirSync(pagesDir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const pageName = file.replace('.tsx', '');
    
    // Determine target directory and filename
    let targetDir = appDir;
    let targetFile = 'page.tsx';
    
    if (pageName.toLowerCase() !== 'home') {
      targetDir = path.join(appDir, pageName.toLowerCase());
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }
    
    const targetPath = path.join(targetDir, targetFile);
    const sourcePath = path.join(pagesDir, file);
    
    let content = fs.readFileSync(sourcePath, 'utf8');
    // Add "use client" as these are all client-side pages currently
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
      content = '"use client";\n\n' + content;
    }
    
    fs.writeFileSync(targetPath, content);
    console.log(`Migrated ${file} to ${targetPath}`);
  }
});
