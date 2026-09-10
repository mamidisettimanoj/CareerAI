import { DsaAttempt, WeakTopicAlert } from '../types/preparation.types';

export function calculateDsaTopicMastery(attempts: DsaAttempt[]): {
  topicScores: Record<string, number>;
  weakTopics: WeakTopicAlert[];
} {
  const topicStats: Record<string, { total: number; solved: number; confidenceSum: number; hardSolved: number }> = {};

  for (const attempt of attempts) {
    if (!topicStats[attempt.topic]) {
      topicStats[attempt.topic] = { total: 0, solved: 0, confidenceSum: 0, hardSolved: 0 };
    }
    const stat = topicStats[attempt.topic];
    stat.total += 1;
    if (attempt.solved) {
      stat.solved += 1;
      if (attempt.difficulty === 'Hard') stat.hardSolved += 1;
    }
    stat.confidenceSum += attempt.confidence || 0;
  }

  const topicScores: Record<string, number> = {};
  const weakTopics: WeakTopicAlert[] = [];

  for (const [topic, stat] of Object.entries(topicStats)) {
    // Basic deterministic scoring
    const accuracy = (stat.solved / stat.total) * 100;
    const avgConfidence = stat.confidenceSum / stat.total;
    
    // Formula: 60% accuracy + 30% confidence + 10% hard problems solved bonus
    let score = (accuracy * 0.6) + (avgConfidence * 0.3) + Math.min(10, stat.hardSolved * 5);
    score = Math.min(100, Math.round(score));
    topicScores[topic] = score;

    if (stat.total >= 3) {
      if (accuracy < 50) {
        weakTopics.push({
          topic,
          module: 'DSA',
          reason: `Accuracy is low (${Math.round(accuracy)}%) across ${stat.total} attempts.`,
          severity: 'HIGH'
        });
      } else if (avgConfidence < 40) {
        weakTopics.push({
          topic,
          module: 'DSA',
          reason: `Accuracy is okay, but self-reported confidence is very low.`,
          severity: 'MEDIUM'
        });
      }
    }
  }

  return { topicScores, weakTopics };
}
