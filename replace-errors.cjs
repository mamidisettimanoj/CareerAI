const fs = require('fs');
const path = require('path');

const actionsDir = path.join(__dirname, 'src/actions');
const files = ['placement.ts', 'jobs.ts', 'copilot.ts', 'applications.ts', 'recruitment.ts'];

for (const file of files) {
  const filePath = path.join(actionsDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. catch (e: any) { ... return { success: false, error: e.message }; }
  content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*(?::\s*any)?\s*\)\s*\{\s*(?:console\.error\([^)]+\);\s*)?return\s*\{\s*(?:success:\s*false,\s*)?error:\s*\1(?:\?)?\.message\s*(?:\?\?[^;]+)?\s*\};?\s*\}/g, (match, errVar) => {
    return `catch (${errVar}: any) {\n    return handleActionError(${errVar});\n  }`;
  });

  if (content !== original) {
    if (!content.includes('handleActionError')) {
      content = `import { handleActionError } from '@/lib/errors';\n` + content;
    }
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
}
