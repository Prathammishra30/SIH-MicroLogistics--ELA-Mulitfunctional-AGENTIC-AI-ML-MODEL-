// Model Performance Evaluator and Comparison Engine
// AgriRoute / RuralFlow ELA Controlled Self-Learning Engine

import type { IMLModel, ModelMetrics } from '../ml/types.js';

export interface ModelComparisonResult {
  activeModelVersion: string;
  candidateModelVersion: string;
  activeMetrics: ModelMetrics;
  candidateMetrics: ModelMetrics;
  isCandidateBetter: boolean;
  improvementPercentage: number;
  recommendation: 'PROMOTE_CANDIDATE' | 'REJECT_CANDIDATE';
}

export class ModelEvaluator {
  public static async compareModels<TInput, TOutput>(
    activeModel: IMLModel<TInput, TOutput>,
    candidateModel: IMLModel<TInput, TOutput>,
    testDataset: Array<{ features: TInput; target: number }>
  ): Promise<ModelComparisonResult> {
    const activeMetrics = await activeModel.evaluate(testDataset);
    const candidateMetrics = await candidateModel.evaluate(testDataset);

    // Lower MAE / RMSE indicates a superior model
    const isCandidateBetter = candidateMetrics.mae < activeMetrics.mae;
    const diff = activeMetrics.mae - candidateMetrics.mae;
    const improvementPercentage = activeMetrics.mae > 0 ? Number(((diff / activeMetrics.mae) * 100).toFixed(2)) : 0;

    return {
      activeModelVersion: activeModel.currentVersion,
      candidateModelVersion: candidateModel.currentVersion,
      activeMetrics,
      candidateMetrics,
      isCandidateBetter,
      improvementPercentage,
      recommendation: isCandidateBetter ? 'PROMOTE_CANDIDATE' : 'REJECT_CANDIDATE',
    };
  }
}
