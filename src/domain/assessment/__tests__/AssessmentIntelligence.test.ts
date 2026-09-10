import { describe, it, expect } from 'vitest';
import { calculateAssessmentScore } from '../engine/AssessmentScoringEngine';
import { analyzeAssessmentHistory } from '../engine/AssessmentIntelligenceEngine';
import { AssessmentVersionDef, AssessmentResultDef } from '../types/assessment.types';

describe('Assessment Intelligence Subsystem', () => {
  
  const mockVersion: AssessmentVersionDef = {
    id: 'v1',
    assessmentId: 'a1',
    versionNumber: 1,
    scoringVersion: '1.0',
    questions: [
      {
        id: 'q1',
        text: 'Q1',
        category: 'Logical',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'o1', text: 'A', isCorrect: true },
          { id: 'o2', text: 'B', isCorrect: false }
        ]
      },
      {
        id: 'q2',
        text: 'Q2',
        category: 'Quantitative',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'o3', text: 'C', isCorrect: true },
          { id: 'o4', text: 'D', isCorrect: false }
        ]
      },
      {
        id: 'q3',
        text: 'Q3',
        category: 'Quantitative',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'o5', text: 'E', isCorrect: false },
          { id: 'o6', text: 'F', isCorrect: true }
        ]
      }
    ]
  };

  describe('Scoring Engine (Authoritative)', () => {
    it('1. should calculate perfect score', () => {
      const answers = [
        { questionId: 'q1', optionId: 'o1' },
        { questionId: 'q2', optionId: 'o3' },
        { questionId: 'q3', optionId: 'o6' }
      ];
      const result = calculateAssessmentScore(mockVersion, answers);
      
      expect(result.score).toBe(3);
      expect(result.maxScore).toBe(3);
      expect(result.percentage).toBe(100);
      expect(result.correct).toBe(3);
      expect(result.incorrect).toBe(0);
      expect(result.unanswered).toBe(0);
      expect(result.categoryScores?.Logical).toBe(100);
      expect(result.categoryScores?.Quantitative).toBe(100);
    });

    it('2. should calculate zero score for all incorrect', () => {
      const answers = [
        { questionId: 'q1', optionId: 'o2' },
        { questionId: 'q2', optionId: 'o4' },
        { questionId: 'q3', optionId: 'o5' }
      ];
      const result = calculateAssessmentScore(mockVersion, answers);
      
      expect(result.score).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.correct).toBe(0);
      expect(result.incorrect).toBe(3);
    });

    it('3. should handle unanswered questions correctly', () => {
      const answers = [
        { questionId: 'q1', optionId: 'o1' },
        { questionId: 'q2', optionId: null }
        // q3 missing completely from answers payload
      ];
      const result = calculateAssessmentScore(mockVersion, answers);
      
      expect(result.score).toBe(1);
      expect(result.correct).toBe(1);
      expect(result.unanswered).toBe(2);
      expect(result.percentage).toBe(33.33); // 1/3 * 100
      expect(result.categoryScores?.Logical).toBe(100);
      expect(result.categoryScores?.Quantitative).toBe(0);
    });

    it('4. should apply negative marking if configured', () => {
      const answers = [
        { questionId: 'q1', optionId: 'o1' }, // Correct (+1)
        { questionId: 'q2', optionId: 'o4' }, // Incorrect (-0.25)
        { questionId: 'q3', optionId: 'o5' }  // Incorrect (-0.25)
      ];
      const result = calculateAssessmentScore(mockVersion, answers, { negativeMarking: true, marksPerQuestion: 1 });
      
      expect(result.score).toBe(0.5); // 1 - 0.5
      expect(result.percentage).toBe(16.67);
      expect(result.correct).toBe(1);
      expect(result.incorrect).toBe(2);
    });

    it('5. should clamp score to minimum 0 with negative marking', () => {
      const answers = [
        { questionId: 'q1', optionId: 'o2' }, // Incorrect (-0.25)
        { questionId: 'q2', optionId: 'o4' }, // Incorrect (-0.25)
        { questionId: 'q3', optionId: 'o5' }  // Incorrect (-0.25)
      ];
      const result = calculateAssessmentScore(mockVersion, answers, { negativeMarking: true, marksPerQuestion: 1 });
      
      expect(result.score).toBe(0); // Clamped from -0.75
      expect(result.percentage).toBe(0);
    });

    it('6. should handle zero questions gracefully', () => {
      const emptyVersion = { ...mockVersion, questions: [] };
      const result = calculateAssessmentScore(emptyVersion, []);
      
      expect(result.score).toBe(0);
      expect(result.maxScore).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('Assessment Intelligence (Trend & Categories)', () => {
    it('7. should return INSUFFICIENT_DATA for empty results', () => {
      const intelligence = analyzeAssessmentHistory('APTITUDE', []);
      expect(intelligence.status).toBe('INSUFFICIENT_DATA');
      expect(intelligence.historicalTrend).toBe('INSUFFICIENT_DATA');
    });

    it('8. should identify strengths and weaknesses from a single result', () => {
      const result: AssessmentResultDef = {
        score: 1, maxScore: 2, percentage: 50, attempted: 2, correct: 1, incorrect: 1, unanswered: 0,
        categoryScores: { 'Logical': 80, 'Quantitative': 20 }
      };
      
      const intelligence = analyzeAssessmentHistory('APTITUDE', [result]);
      
      expect(intelligence.status).toBe('AVAILABLE');
      expect(intelligence.strengths).toContain('Logical');
      expect(intelligence.weaknesses).toContain('Quantitative');
      expect(intelligence.historicalTrend).toBe('INSUFFICIENT_DATA'); // Only 1 attempt
    });

    it('9. should detect IMPROVING trend', () => {
      const res1: AssessmentResultDef = { score: 10, maxScore: 100, percentage: 40, attempted: 10, correct: 4, incorrect: 6, unanswered: 0 };
      const res2: AssessmentResultDef = { score: 20, maxScore: 100, percentage: 60, attempted: 10, correct: 6, incorrect: 4, unanswered: 0 };
      
      const intelligence = analyzeAssessmentHistory('APTITUDE', [res1, res2]);
      
      expect(intelligence.historicalTrend).toBe('IMPROVING');
      expect(intelligence.overallScore).toBe(60); // uses latest
    });

    it('10. should detect DECLINING trend', () => {
      const res1: AssessmentResultDef = { score: 20, maxScore: 100, percentage: 80, attempted: 10, correct: 8, incorrect: 2, unanswered: 0 };
      const res2: AssessmentResultDef = { score: 10, maxScore: 100, percentage: 50, attempted: 10, correct: 5, incorrect: 5, unanswered: 0 };
      
      const intelligence = analyzeAssessmentHistory('APTITUDE', [res1, res2]);
      
      expect(intelligence.historicalTrend).toBe('DECLINING');
    });

    it('11. should detect STABLE trend', () => {
      const res1: AssessmentResultDef = { score: 20, maxScore: 100, percentage: 70, attempted: 10, correct: 7, incorrect: 3, unanswered: 0 };
      const res2: AssessmentResultDef = { score: 21, maxScore: 100, percentage: 72, attempted: 10, correct: 7, incorrect: 3, unanswered: 0 };
      
      const intelligence = analyzeAssessmentHistory('APTITUDE', [res1, res2]);
      
      expect(intelligence.historicalTrend).toBe('STABLE'); // <= 5% difference
    });
  });

  describe('Additional Security & Boundary Validations', () => {
    it('12. should handle version mismatch gracefully in scoring (ignored invalid answers)', () => {
      // Sending an answer to a question that doesn't exist in this version
      const answers = [
        { questionId: 'q1', optionId: 'o1' },
        { questionId: 'invalid_q', optionId: 'o99' }
      ];
      const result = calculateAssessmentScore(mockVersion, answers);
      
      // invalid_q is ignored, q2, q3 are unanswered
      expect(result.score).toBe(1);
      expect(result.correct).toBe(1);
      expect(result.unanswered).toBe(2);
      expect(result.attempted).toBe(1);
    });

    it('13. should handle invalid option selection as incorrect', () => {
      const answers = [
        { questionId: 'q1', optionId: 'invalid_o' }
      ];
      const result = calculateAssessmentScore(mockVersion, answers);
      
      // Treated as incorrect because it doesn't match the correct option ID
      expect(result.score).toBe(0);
      expect(result.incorrect).toBe(1);
    });

    it('14. should handle null optionId explicitly as unanswered', () => {
      const answers = [
        { questionId: 'q1', optionId: null }
      ];
      const result = calculateAssessmentScore(mockVersion, answers);
      
      expect(result.unanswered).toBe(3);
    });
  });

});
