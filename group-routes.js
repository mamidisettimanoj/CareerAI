import fs from 'fs';
import path from 'path';

const appDir = path.join(process.cwd(), 'src', 'app');
const dashboardGroupDir = path.join(appDir, '(dashboard)');

if (!fs.existsSync(dashboardGroupDir)) {
  fs.mkdirSync(dashboardGroupDir, { recursive: true });
}

const routesToMove = [
  'dashboard', 'calculators', 'academic', 'eligibility', 
  'skills', 'resume', 'preparation', 'about', 'settings', 'projects'
];

routesToMove.forEach(route => {
  const sourcePath = path.join(appDir, route);
  const targetPath = path.join(dashboardGroupDir, route);
  
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    console.log(`Moved ${route} to (dashboard)/${route}`);
  }
});
