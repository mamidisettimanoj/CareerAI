import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/app/predict/page.tsx',
  'src/app/result/page.tsx',
  'src/app/(dashboard)/academic/page.tsx',
  'src/app/(dashboard)/preparation/page.tsx',
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/app/(dashboard)/eligibility/page.tsx',
  'src/app/(dashboard)/projects/page.tsx',
  'src/app/(dashboard)/settings/page.tsx',
  'src/app/(dashboard)/skills/page.tsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import
    content = content.replace(
      /import\s+\{.*\}\s+from\s+['"]@\/lib\/storage['"];/g,
      "import { dataService } from '@/services/LocalStorageDataService';"
    );
    
    // Replace function calls
    content = content.replace(/loadData\(/g, "dataService.loadData(");
    content = content.replace(/saveData\(/g, "dataService.saveData(");
    content = content.replace(/loadDemoProfile\(/g, "dataService.loadDemoProfile(");
    content = content.replace(/clearData\(/g, "dataService.clearData(");
    content = content.replace(/exportData\(/g, "dataService.exportData(");
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
