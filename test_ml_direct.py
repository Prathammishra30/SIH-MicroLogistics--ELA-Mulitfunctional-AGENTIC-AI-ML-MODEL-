import asyncio
from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.neural.provider import DistilledSemanticNeuralProvider
from ai.ela.core.decision_support import DecisionSupportEngine

async def test_ml():
    print('=== DIRECT ML MODEL INVOCATION ===')
    
    match_model = VehicleMatchingModel()
    match_res = await match_model.predict(VehicleMatchingFeatures(
        cargo_weight_kg=500.0,
        available_vehicles=[
            {'id': 'veh-1', 'type': 'Mini Truck (750 kg)', 'capacity': 750.0, 'rating': 4.8},
            {'id': 'veh-2', 'type': 'Pickup Van (1.5 Ton)', 'capacity': 1500.0, 'rating': 4.5},
            {'id': 'veh-3', 'type': 'Medium Truck (3.5 Ton)', 'capacity': 3500.0, 'rating': 4.9},
        ]
    ))
    print('VehicleMatchingModel:')
    print('  Implementation:', match_res.implementation_type)
    top = match_res.prediction.top_recommendation
    if top:
        print('  Top:', top.vehicle_type)
        print('  Match Score:', top.match_score)
    print('  Confidence:', match_res.confidence)
    print('  Status:', match_res.model_status)
    
    eta_model = ETAPredictionModel()
    eta_res = await eta_model.predict(EtaFeatures(
        origin='Nashik', destination='Pune APMC Mandi', distance_km=210.0,
        vehicle_type='Mini Truck (750 kg)', departure_hour=8
    ))
    print('ETAPredictionModel:')
    print('  Implementation:', eta_res.implementation_type)
    print('  ETA:', eta_res.prediction.formatted_duration)
    print('  Baseline:', eta_res.prediction.baseline_duration_minutes, 'min')
    print('  Learned Residual:', eta_res.prediction.learned_residual_minutes, 'min')
    print('  Confidence:', eta_res.confidence)
    
    cost_model = TransportCostModel()
    cost_res = await cost_model.predict(TransportCostFeatures(
        distance_km=210.0, weight_kg=500.0, vehicle_type='Mini Truck (750 kg)'
    ))
    print('TransportCostModel:')
    print('  Implementation:', cost_res.implementation_type)
    print('  Cost:', cost_res.prediction.estimated_cost)
    print('  Baseline Tariff:', cost_res.prediction.baseline_tariff_cost)
    print('  Learned Surcharge:', cost_res.prediction.learned_surcharge_cost)
    print('  Confidence:', cost_res.confidence)
    
    decision_engine = DecisionSupportEngine()
    dec_res = await decision_engine.evaluate_transport_options(
        origin='Nashik', destination='Pune APMC Mandi',
        commodity='Tomatoes', weight_kg=500.0,
        available_vehicles=[
            {'id': 'veh-1', 'type': 'Mini Truck (750 kg)', 'capacity': 750.0, 'rating': 4.8},
            {'id': 'veh-2', 'type': 'Pickup Van (1.5 Ton)', 'capacity': 1500.0, 'rating': 4.5},
        ],
        user_preference='BALANCED'
    )
    print('DecisionSupportEngine:')
    print('  Strategy:', dec_res.strategy_applied)
    if dec_res.recommended_option:
        print('  Recommended:', dec_res.recommended_option.vehicle_type)
        print('  Freight:', dec_res.recommended_option.estimated_cost)
        print('  ETA:', dec_res.recommended_option.formatted_duration)
    print('  Confidence:', dec_res.confidence)
    
    neural = DistilledSemanticNeuralProvider()
    vec1 = neural.embed_text('500 kg tomatoes from Nashik to Pune')
    vec2 = neural.embed_text('Nashik to Pune tomato logistics transport')
    sim = neural.compute_similarity(vec1, vec2)
    anom = neural.detect_operational_anomaly(180.0, 360.0, {'origin': 'Nashik', 'destination': 'Pune'})
    print('Neural Provider:')
    print('  Embedding Dim:', len(vec1))
    print('  Semantic Sim:', round(sim, 3))
    print('  Anomaly Detection: is_anomaly={}, score={}'.format(anom.is_anomaly, anom.anomaly_score))

asyncio.run(test_ml())