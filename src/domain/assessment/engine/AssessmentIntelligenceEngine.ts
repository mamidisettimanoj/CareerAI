import { AssessmentResultDef, AssessmentIntelligenceResult, AssessmentCategory } from '../types/assessment.types';

export function analyzeAssessmentHistory(
  category: AssessmentCategory,
  results: AssessmentResultDef[]
): AssessmentIntelligenceResult {
  if (!results || results.length === 0) {
    return {
      overallScore: 0,
      categoryPerformance: {},
      strengths: [],
      weaknesses: [],
      historicalTrend: 'INSUFFICIENT_DATA',
      status: 'INSUFFICIENT_DATA'
    };
  }

  // Sort by date if we had dates, but we assume results are chronological (oldest to newest)
  const latestResult = results[results.length - 1];
  
  // Overall score is the percentage of the latest result
  const overallScore = latestResult.percentage;

  // Category performance from latest result
  const categoryPerformance = latestResult.categoryScores || {};

  // Strengths and weaknesses based on category scores
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  for (const [cat, score] of Object.entries(categoryPerformance)) {
    if (score >= 75) strengths.push(cat);
    if (score < 50) weaknesses.push(cat);
  }

  // Determine trend if >= 2 results
  let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
  if (results.length >= 2) {
    const previousResult = results[results.length - 2];
    const diff = latestResult.percentage - previousResult.percentage;
    
    if (diff > 5) trend = 'IMPROVING';
    else if (diff < -5) trend = 'DECLINING';
    else trend = 'STABLE';
  }

  return {
    overallScore,
    categoryPerformance,
    strengths,
    weaknesses,
    historicalTrend: trend,
    status: 'AVAILABLE'
  };
}
