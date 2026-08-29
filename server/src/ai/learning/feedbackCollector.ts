// Telemetry, User Feedback, and Outcome Collector
// AgriRoute / RuralFlow ELA Controlled Self-Learning Engine

export interface UserFeedbackRecord {
  id: string;
  userId?: string;
  role: string;
  rating: 'POSITIVE' | 'NEGATIVE';
  feedbackText?: string;
  correctedIntent?: string;
  correctedEntities?: Record<string, unknown>;
  timestamp: string;
}

export interface PredictionOutcomeRecord {
  id: string;
  modelName: string;
  modelVersion: string;
  predictedValue: number;
  actualValue: number;
  absoluteError: number;
  percentageError: number;
  features: Record<string, unknown>;
  timestamp: string;
}

export class FeedbackCollector {
  private static feedbackList: UserFeedbackRecord[] = [];
  private static outcomeList: PredictionOutcomeRecord[] = [];

  public static recordUserFeedback(record: Omit<UserFeedbackRecord, 'id' | 'timestamp'>): UserFeedbackRecord {
    const entry: UserFeedbackRecord = {
      ...record,
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.feedbackList.push(entry);
    return entry;
  }

  public static recordPredictionOutcome(
    modelName: string,
    modelVersion: string,
    predictedValue: number,
    actualValue: number,
    features: Record<string, unknown>
  ): PredictionOutcomeRecord {
    const absoluteError = Math.abs(predictedValue - actualValue);
    const percentageError = actualValue > 0 ? Number(((absoluteError / actualValue) * 100).toFixed(1)) : 0;

    const entry: PredictionOutcomeRecord = {
      id: `out-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      modelName,
      modelVersion,
      predictedValue,
      actualValue,
      absoluteError,
      percentageError,
      features,
      timestamp: new Date().toISOString(),
    };

    this.outcomeList.push(entry);
    return entry;
  }

  public static getFeedbackHistory(): UserFeedbackRecord[] {
    return [...this.feedbackList];
  }

  public static getOutcomeHistory(modelName?: string): PredictionOutcomeRecord[] {
    if (modelName) {
      return this.outcomeList.filter((o) => o.modelName === modelName);
    }
    return [...this.outcomeList];
  }
}
