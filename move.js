import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

const dirsToMove = ['app', 'components', 'hooks', 'lib', 'types'];

dirsToMove.forEach(dir => {
  const sourceDir = path.join(rootDir, dir);
  const targetDir = path.join(srcDir, dir);
  
  if (fs.existsSync(sourceDir)) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      // Move file or directory
      fs.renameSync(sourcePath, targetPath);
    });
    
    // Remove empty source dir
    fs.rmdirSync(sourceDir);
  }
});

console.log("Directories merged into src/ successfully.");
