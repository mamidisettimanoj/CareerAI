import fs from 'fs';
import path from 'path';

const appDir = path.join(process.cwd(), 'src', 'app');
const files = fs.readdirSync(appDir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const pageName = file.replace('.tsx', '');
    
    let targetDir = appDir;
    let targetFile = 'page.tsx';
    
    if (pageName.toLowerCase() !== 'home') {
      targetDir = path.join(appDir, pageName.toLowerCase());
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }
    
    const targetPath = path.join(targetDir, targetFile);
    const sourcePath = path.join(appDir, file);
    
    let content = fs.readFileSync(sourcePath, 'utf8');
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
      content = '"use client";\n\n' + content;
    }
    
    fs.writeFileSync(targetPath, content);
    console.log(`Migrated ${file} to ${targetPath}`);
    
    if (sourcePath !== targetPath) {
      fs.unlinkSync(sourcePath);
    }
  }
});
