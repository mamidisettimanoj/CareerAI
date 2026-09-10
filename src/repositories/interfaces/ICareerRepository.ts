import { IntelligenceResult, PredictionResult } from '@/types';

export interface ICareerRepository {
  getEngineResult(): Promise<IntelligenceResult | null>;
  saveEngineResult(result: IntelligenceResult): Promise<void>;
  getPredictions(): Promise<PredictionResult[]>;
  savePredictions(predictions: PredictionResult[]): Promise<void>;
}
