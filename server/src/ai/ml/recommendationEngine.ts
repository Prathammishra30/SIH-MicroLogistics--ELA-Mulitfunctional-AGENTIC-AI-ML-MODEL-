// ELA Recommendation Engine
// Aggregates predictions across Demand, Price, ETA, and Matching to generate domain recommendations

import type { DemandPredictorModel } from './demandPredictor.js';
import type { PricePredictorModel } from './pricePredictor.js';
import type { EtaPredictorModel } from './etaPredictor.js';
import type { MatchingEngineModel } from './matchingEngine.js';
import { prisma } from '../../config/prisma.js';

export interface FarmerRecommendation {
  cropName: string;
  recommendedAction: string;
  expectedPrice: string;
  demandTrend: string;
  confidence: number;
}

export interface TransporterTripRecommendation {
  tripId: string;
  productName: string;
  pickup: string;
  destination: string;
  earnings: string;
  matchScore: number;
  rating: string;
}

export class RecommendationEngine {
  constructor(
    private demandModel: DemandPredictorModel,
    private priceModel: PricePredictorModel,
    private _etaModel: EtaPredictorModel,
    private matchingModel: MatchingEngineModel
  ) {}

  public async getFarmerCropRecommendations(location: string = 'Pune'): Promise<FarmerRecommendation[]> {
    const candidateCrops = ['Tomatoes', 'Onions', 'Potatoes', 'Wheat', 'Grapes'];
    const recommendations: FarmerRecommendation[] = [];

    for (const crop of candidateCrops) {
      const demand = await this.demandModel.predict({ cropName: crop, location, month: new Date().getMonth() + 1 });
      const price = await this.priceModel.predict({ cropName: crop, mandiLocation: `${location} APMC`, grade: 'A' });

      recommendations.push({
        cropName: crop,
        recommendedAction:
          demand.prediction.trend === 'INCREASING'
            ? 'High market demand. Ideal time to harvest and ship.'
            : 'Moderate demand. Fulfill existing orders.',
        expectedPrice: `₹${price.prediction.minPrice}–₹${price.prediction.maxPrice}/kg`,
        demandTrend: demand.prediction.trend,
        confidence: Number(((demand.confidence + price.confidence) / 2).toFixed(2)),
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  public async getTransporterLoadRecommendations(transporterCapacityKg: number = 1500): Promise<TransporterTripRecommendation[]> {
    try {
      const availableTrips = await prisma.logisticsRequest.findMany({
        where: { status: 'Searching' },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      const recommendations: TransporterTripRecommendation[] = [];

      for (const trip of availableTrips) {
        let loadKg = 800;
        if (trip.quantity) {
          const num = parseFloat(trip.quantity.replace(/[^\d.]/g, ''));
          if (!isNaN(num)) loadKg = num;
        }

        let earnings = 3000;
        if (trip.estimatedEarnings) {
          const num = parseFloat(trip.estimatedEarnings.replace(/[^\d.]/g, ''));
          if (!isNaN(num)) earnings = num;
        }

        const match = await this.matchingModel.predict({
          transporterCapacityKg,
          loadQuantityKg: loadKg,
          distanceKm: 85,
          offeredEarnings: earnings,
        });

        recommendations.push({
          tripId: trip.id,
          productName: trip.productName,
          pickup: trip.pickupLocation || 'Farm Pickup',
          destination: trip.destination,
          earnings: trip.estimatedEarnings || `₹${earnings}`,
          matchScore: match.prediction.matchScore,
          rating: match.prediction.compatibilityRating,
        });
      }

      return recommendations.sort((a, b) => b.matchScore - a.matchScore);
    } catch {
      return [];
    }
  }
}
