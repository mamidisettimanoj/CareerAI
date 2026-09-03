import { 
  AssessmentVersionDef, 
  AssessmentAnswerDef, 
  AssessmentResultDef 
} from '../types/assessment.types';

export function calculateAssessmentScore(
  version: AssessmentVersionDef,
  answers: AssessmentAnswerDef[],
  config: { negativeMarking?: boolean; marksPerQuestion?: number } = {}
): AssessmentResultDef {
  const marksPerQuestion = config.marksPerQuestion || 1;
  const negativeMarkPenalty = config.negativeMarking ? (marksPerQuestion * 0.25) : 0;
  
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const categoryScores: Record<string, { correct: number, total: number }> = {};

  const answerMap = new Map(answers.map(a => [a.questionId, a.optionId]));

  for (const question of version.questions) {
    const category = question.category || 'General';
    if (!categoryScores[category]) {
      categoryScores[category] = { correct: 0, total: 0 };
    }
    categoryScores[category].total += marksPerQuestion;

    const selectedOptionId = answerMap.get(question.id);
    if (!selectedOptionId) {
      unanswered++;
      continue;
    }

    const correctOption = question.options.find(o => o.isCorrect);
    
    // Fallback: If no correct option exists in the version, we can't grade it correctly.
    // In a real system, schema validates this. Here we treat it as unanswered or incorrect if missing.
    if (!correctOption) {
      unanswered++;
      continue;
    }

    if (selectedOptionId === correctOption.id) {
      correct++;
      categoryScores[category].correct += marksPerQuestion;
    } else {
      incorrect++;
      if (config.negativeMarking) {
        categoryScores[category].correct -= negativeMarkPenalty;
      }
    }
  }

  const rawScore = (correct * marksPerQuestion) - (incorrect * negativeMarkPenalty);
  const maxScore = version.questions.length * marksPerQuestion;
  
  // Clamp score
  const score = Math.max(0, Math.min(rawScore, maxScore));
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  const finalCategoryScores: Record<string, number> = {};
  for (const [cat, data] of Object.entries(categoryScores)) {
    const catScore = Math.max(0, data.correct);
    finalCategoryScores[cat] = data.total > 0 ? (catScore / data.total) * 100 : 0;
  }

  return {
    score,
    maxScore,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
    attempted: correct + incorrect,
    correct,
    incorrect,
    unanswered,
    categoryScores: finalCategoryScores
  };
}
