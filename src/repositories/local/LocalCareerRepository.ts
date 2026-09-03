import { ICareerRepository } from '../interfaces/ICareerRepository';
import { IntelligenceResult, PredictionResult } from '@/types';
import * as storage from '@/lib/storage';

export class LocalCareerRepository implements ICareerRepository {
  async getEngineResult(): Promise<IntelligenceResult | null> {
    return storage.loadData().engineResult || null;
  }

  async saveEngineResult(result: IntelligenceResult): Promise<void> {
    storage.saveData({ engineResult: result });
  }

  async getPredictions(): Promise<PredictionResult[]> {
    return storage.loadData().predictions || [];
  }

  async savePredictions(predictions: PredictionResult[]): Promise<void> {
    storage.saveData({ predictions });
  }
}
