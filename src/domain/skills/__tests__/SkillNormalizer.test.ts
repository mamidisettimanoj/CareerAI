import { describe, it, expect } from 'vitest';
import { normalizeSkillName } from '../engine/SkillNormalizer';

describe('SkillNormalizer', () => {
  it('1. JavaScript/javascript/JS', () => {
    expect(normalizeSkillName('JavaScript')).toBe('JavaScript');
    expect(normalizeSkillName('javascript')).toBe('JavaScript');
    expect(normalizeSkillName('js')).toBe('JavaScript');
  });

  it('2. Node/Node.js/nodejs', () => {
    expect(normalizeSkillName('Node')).toBe('Node.js');
    expect(normalizeSkillName('Node.js')).toBe('Node.js');
    expect(normalizeSkillName('nodejs')).toBe('Node.js');
  });

  it('3. PostgreSQL/postgres', () => {
    expect(normalizeSkillName('PostgreSQL')).toBe('PostgreSQL');
    expect(normalizeSkillName('postgres')).toBe('PostgreSQL');
    expect(normalizeSkillName('psql')).toBe('PostgreSQL');
  });

  it('4. React/React.js', () => {
    expect(normalizeSkillName('React')).toBe('React');
    expect(normalizeSkillName('react.js')).toBe('React');
  });

  it('5. Java vs JavaScript distinction', () => {
    expect(normalizeSkillName('Java')).toBe('Java');
    expect(normalizeSkillName('JavaScript')).toBe('JavaScript');
    expect(normalizeSkillName('Java')).not.toBe(normalizeSkillName('JavaScript'));
  });

  it('6. C vs C++ distinction', () => {
    expect(normalizeSkillName('C')).toBe('C');
    expect(normalizeSkillName('C++')).toBe('C++');
    expect(normalizeSkillName('cpp')).toBe('C++');
    expect(normalizeSkillName('C')).not.toBe(normalizeSkillName('C++'));
  });

  it('7. unknown skill', () => {
    expect(normalizeSkillName('unknown skill')).toBe('Unknown Skill');
  });
});
