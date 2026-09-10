import { ICareerRepository } from '../interfaces/ICareerRepository';
import { IntelligenceResult, PredictionResult } from '@/types';
import { db } from '@/lib/db';

export class LocalCareerRepository implements ICareerRepository {
  async getEngineResult(): Promise<IntelligenceResult | null> {
    if (!db) return null;
    try {
      const record = await db.engineResult.get('latest');
      if (!record) return null;
      const { id, ...result } = record;
      return result as IntelligenceResult;
    } catch (error) {
      console.error("Failed to get engine result from DB", error);
      return null;
    }
  }

  async saveEngineResult(result: IntelligenceResult): Promise<void> {
    if (!db) return;
    try {
      await db.engineResult.put({ ...result, id: 'latest' });
    } catch (error) {
      console.error("Failed to save engine result to DB", error);
    }
  }

  async getPredictions(): Promise<PredictionResult[]> {
    if (!db) return [];
    try {
      return await db.predictions.orderBy('date').reverse().toArray();
    } catch (error) {
      console.error("Failed to get predictions from DB", error);
      return [];
    }
  }

  async savePredictions(predictions: PredictionResult[]): Promise<void> {
    if (!db) return;
    try {
      await db.transaction('rw', db.predictions, async () => {
        await db.predictions.clear();
        await db.predictions.bulkPut(predictions);
      });
    } catch (error) {
      console.error("Failed to save predictions to DB", error);
    }
  }
}
