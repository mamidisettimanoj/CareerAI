// src/domain/skills/engine/SkillNormalizer.ts

const ALIAS_MAP: Record<string, string> = {
  // JavaScript
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'es6': 'JavaScript',
  
  // TypeScript
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  
  // Node
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',

  // React
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',

  // React Native
  'react native': 'React Native',
  'reactnative': 'React Native',

  // Python
  'py': 'Python',
  'python': 'Python',
  'python3': 'Python',

  // Java
  'java': 'Java',
  // Note: Java is distinct from JavaScript, handled securely.

  // C++
  'c++': 'C++',
  'cpp': 'C++',
  
  // C
  'c': 'C',
  
  // HTML
  'html': 'HTML',
  'html5': 'HTML',
  
  // CSS
  'css': 'CSS',
  'css3': 'CSS',

  // Postgres
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'psql': 'PostgreSQL',

  // SQL
  'sql': 'SQL',
  'mysql': 'MySQL', // Note: keep distinct
  
  // AWS
  'aws': 'AWS',
  'amazon web services': 'AWS',
  
  // Machine Learning
  'ml': 'Machine Learning',
  'machine learning': 'Machine Learning',
  
  // Data Structures & Algorithms
  'dsa': 'Data Structures & Algorithms',
  'data structures and algorithms': 'Data Structures & Algorithms',
  'data structures': 'Data Structures',
  'algorithms': 'Algorithms',
};

/**
 * Normalizes a skill name to its canonical representation.
 * If no alias is found, it returns the trimmed string with proper casing.
 */
export function normalizeSkillName(rawName: string): string {
  if (!rawName) return '';
  
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  
  if (ALIAS_MAP[lower]) {
    return ALIAS_MAP[lower];
  }
  
  // Basic casing formatting if no exact alias: 'machine learning' -> 'Machine Learning'
  return trimmed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
