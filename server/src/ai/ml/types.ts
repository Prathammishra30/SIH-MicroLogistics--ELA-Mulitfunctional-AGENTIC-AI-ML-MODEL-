// Machine Learning Core Types and Contracts
// AgriRoute / RuralFlow ELA ML Gateway

export interface ModelMetrics {
  mae: number;
  rmse: number;
  rSquared?: number;
  sampleCount: number;
  evaluatedAt: string;
}

export interface PredictionResult<T> {
  prediction: T;
  confidence: number; // 0.0 - 1.0
  explanation: string;
  modelName: string;
  modelVersion: string;
  timestamp: string;
  inputFeatures: Record<string, unknown>;
  metrics?: ModelMetrics;
}

export interface ModelVersionInfo {
  modelName: string;
  version: string;
  status: 'ACTIVE' | 'CANDIDATE' | 'RETIRED';
  metrics: ModelMetrics;
  trainedAt: string;
  datasetSize: number;
  description?: string;
}

export interface DemandInputFeatures {
  cropName: string;
  location: string;
  month: number;
  historicalAvgKg?: number;
  activeBuyerCount?: number;
  seasonalFactor?: number;
}

export interface DemandPredictionOutput {
  predictedDemandKg: number;
  confidence: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  demandLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SURGE';
  suggestedAction: string;
}

export interface PriceInputFeatures {
  cropName: string;
  mandiLocation: string;
  grade: 'A' | 'B' | 'Premium' | 'Standard';
  currentArrivalsKg?: number;
  historicalPrice?: number;
  month?: number;
}

export interface PricePredictionOutput {
  predictedAvgPrice: number;
  minPrice: number;
  maxPrice: number;
  unit: string;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  priceTrend: 'RISING' | 'STABLE' | 'FALLING';
}

export interface EtaInputFeatures {
  pickupLocation: string;
  destination: string;
  distanceKm: number;
  vehicleType: string;
  departureHour?: number;
  weatherCondition?: 'CLEAR' | 'RAIN' | 'FOG';
}

export interface EtaPredictionOutput {
  estimatedDurationMinutes: number;
  estimatedArrivalIso: string;
  formattedDuration: string;
  trafficDelayMinutes: number;
  confidence: number;
}

export interface MatchInputFeatures {
  transporterCapacityKg: number;
  loadQuantityKg: number;
  distanceKm: number;
  offeredEarnings: number;
  routePreference?: string;
}

export interface MatchPredictionOutput {
  matchScore: number; // 0 - 100
  capacityMatchPercent: number;
  earningsPerKm: number;
  compatibilityRating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  recommendationReason: string;
}

export interface IMLModel<TInput, TOutput> {
  readonly modelName: string;
  readonly currentVersion: string;
  train(dataset: Array<{ features: TInput; target: number | string }>): Promise<ModelMetrics>;
  predict(features: TInput): Promise<PredictionResult<TOutput>>;
  evaluate(testDataset: Array<{ features: TInput; target: number | string }>): Promise<ModelMetrics>;
}
