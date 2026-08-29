// Model Governance Registry and Version Control Engine
// AgriRoute / RuralFlow ELA Controlled Self-Learning Engine

import type { ModelVersionInfo, IMLModel } from '../ml/types.js';
import { ModelEvaluator } from './evaluator.js';

export class ModelRegistry {
  private static versions: Map<string, ModelVersionInfo[]> = new Map();

  public static registerVersion(info: ModelVersionInfo): void {
    const list = this.versions.get(info.modelName) || [];
    list.push(info);
    this.versions.set(info.modelName, list);
  }

  public static getVersions(modelName: string): ModelVersionInfo[] {
    return this.versions.get(modelName) || [];
  }

  public static getActiveVersion(modelName: string): ModelVersionInfo | undefined {
    const list = this.versions.get(modelName) || [];
    return list.find((v) => v.status === 'ACTIVE');
  }

  /**
   * Controlled Promotion Pipeline:
   * Compares candidate against active model on a validated test dataset.
   * Only promotes if candidate achieves lower prediction error (MAE).
   */
  public static async evaluateAndPromoteCandidate<TInput, TOutput>(
    activeModel: IMLModel<TInput, TOutput>,
    candidateModel: IMLModel<TInput, TOutput>,
    testDataset: Array<{ features: TInput; target: number }>
  ): Promise<{ promoted: boolean; summary: string }> {
    const comp = await ModelEvaluator.compareModels(activeModel, candidateModel, testDataset);

    if (comp.isCandidateBetter) {
      // Mark candidate active and retire old active
      const list = this.versions.get(activeModel.modelName) || [];
      for (const item of list) {
        if (item.version === activeModel.currentVersion) item.status = 'RETIRED';
        if (item.version === candidateModel.currentVersion) item.status = 'ACTIVE';
      }

      return {
        promoted: true,
        summary: `Promoted candidate ${candidateModel.currentVersion} (MAE improved by ${comp.improvementPercentage}% over ${activeModel.currentVersion}).`,
      };
    } else {
      return {
        promoted: false,
        summary: `Rejected candidate ${candidateModel.currentVersion} (MAE did not exceed active model ${activeModel.currentVersion}).`,
      };
    }
  }
}
