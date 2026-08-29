// Training Dataset Generator from Validated Outcomes
// AgriRoute / RuralFlow ELA Controlled Self-Learning Engine

import { FeedbackCollector } from './feedbackCollector.js';

export interface ValidatedTrainingSample<TFeatures> {
  features: TFeatures;
  target: number;
  sampleId: string;
  source: 'OUTCOME_TELEMETRY' | 'EXPERT_LABEL' | 'HISTORICAL_SEED';
  recordedAt: string;
}

export class DatasetBuilder {
  public static buildDatasetFromOutcomes<TFeatures>(
    modelName: string
  ): ValidatedTrainingSample<TFeatures>[] {
    const outcomes = FeedbackCollector.getOutcomeHistory(modelName);

    return outcomes.map((o) => ({
      features: o.features as TFeatures,
      target: o.actualValue,
      sampleId: o.id,
      source: 'OUTCOME_TELEMETRY',
      recordedAt: o.timestamp,
    }));
  }
}
