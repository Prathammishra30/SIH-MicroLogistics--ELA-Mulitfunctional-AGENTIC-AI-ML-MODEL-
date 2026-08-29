// Transporter-Load Matching Engine (Multi-Objective Optimization ML Model)
// AgriRoute / RuralFlow ELA ML Gateway

import { BaseMLModel } from './baseModel.js';
import type {
  IMLModel,
  MatchInputFeatures,
  MatchPredictionOutput,
  ModelMetrics,
  PredictionResult,
} from './types.js';

export class MatchingEngineModel extends BaseMLModel
  implements IMLModel<MatchInputFeatures, MatchPredictionOutput> {
  public readonly modelName = 'transporter-load-matcher';
  public currentVersion = 'matching-v1';

  constructor() {
    super();
    this.trainInitialModel();
  }

  private encodeFeatures(f: MatchInputFeatures): number[] {
    const capacity = Math.max(100, f.transporterCapacityKg || 1500);
    const load = Math.max(50, f.loadQuantityKg || 800);
    const utilRatio = load / capacity;
    const dist = Math.max(5, f.distanceKm || 60);
    const earnings = Math.max(500, f.offeredEarnings || 3000);
    const earningsPerKm = earnings / dist;

    return [utilRatio, dist, earningsPerKm];
  }

  private trainInitialModel(): void {
    const X: number[][] = [];
    const y: number[] = [];

    for (let u = 0.2; u <= 1.2; u += 0.1) {
      for (const dist of [30, 80, 150, 250]) {
        for (const epk of [18, 25, 35, 48]) {
          // Optimal utilization is 0.70 to 0.95
          let utilScore = 100 - Math.abs(u - 0.85) * 120;
          if (u > 1.0) utilScore = Math.max(0, 100 - (u - 1.0) * 400); // Overloaded penalty
          utilScore = Math.max(10, Math.min(100, utilScore));

          const earningsScore = Math.min(100, (epk / 40) * 90);
          const routeScore = dist < 180 ? 90 : 75;

          const target = Math.round(0.45 * utilScore + 0.35 * earningsScore + 0.20 * routeScore);
          X.push([u, dist, epk]);
          y.push(target);
        }
      }
    }

    this.fitRidgeRegression(X, y, 0.01, 0.05, 100);
  }

  public async train(
    dataset: Array<{ features: MatchInputFeatures; target: number }>
  ): Promise<ModelMetrics> {
    const X = dataset.map((d) => this.encodeFeatures(d.features));
    const y = dataset.map((d) => Number(d.target));
    this.fitRidgeRegression(X, y);
    return this.evaluate(dataset);
  }

  public async evaluate(
    testDataset: Array<{ features: MatchInputFeatures; target: number }>
  ): Promise<ModelMetrics> {
    const predictions = testDataset.map((d) => this.predictLinear(this.encodeFeatures(d.features)));
    const actuals = testDataset.map((d) => Number(d.target));
    return BaseMLModel.computeMetrics(predictions, actuals);
  }

  public async predict(features: MatchInputFeatures): Promise<PredictionResult<MatchPredictionOutput>> {
    const capacity = Math.max(100, features.transporterCapacityKg || 1500);
    const load = Math.max(50, features.loadQuantityKg || 800);
    const dist = Math.max(5, features.distanceKm || 60);
    const earnings = Math.max(500, features.offeredEarnings || 3000);

    const utilRatio = load / capacity;
    const capacityMatchPercent = Math.min(100, Math.round(utilRatio * 100));
    const earningsPerKm = Number((earnings / dist).toFixed(1));

    const vector = this.encodeFeatures(features);
    const rawScore = this.predictLinear(vector);
    const matchScore = Math.max(10, Math.min(99, Math.round(rawScore)));

    let rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' = 'MODERATE';
    if (matchScore >= 85) rating = 'EXCELLENT';
    else if (matchScore >= 70) rating = 'GOOD';
    else if (matchScore < 50) rating = 'POOR';

    const output: MatchPredictionOutput = {
      matchScore,
      capacityMatchPercent,
      earningsPerKm,
      compatibilityRating: rating,
      recommendationReason:
        matchScore >= 80
          ? `High efficiency load (${capacityMatchPercent}% vehicle utilization @ ₹${earningsPerKm}/km). Recommended to accept.`
          : `Moderate fit (${capacityMatchPercent}% utilization). Fits available space.`,
    };

    return {
      prediction: output,
      confidence: 0.91,
      explanation: `ELA Recommendation Match Score: **${matchScore}/100** (${rating}). Utilization: **${capacityMatchPercent}%**, Expected Freight: **₹${earnings.toLocaleString('en-IN')}** (₹${earningsPerKm}/km).`,
      modelName: this.modelName,
      modelVersion: this.currentVersion,
      timestamp: new Date().toISOString(),
      inputFeatures: features as unknown as Record<string, unknown>,
    };
  }
}
