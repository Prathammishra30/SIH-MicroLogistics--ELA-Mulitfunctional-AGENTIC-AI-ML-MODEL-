# Comprehensive ML Authenticity & Hardening Tests (Phase 5B.1 Python Core)
import pytest
import os
import tempfile
from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures
from ai.ela.ml.training.pipeline import MLTrainingPipeline, SyntheticDataGenerator
from ai.ela.ml.training.trainer import train_and_persist_all_models
from ai.ela.core.decision_support import DecisionSupportEngine
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.evaluator import GovernedModelEvaluator, ModelRegistry
from ai.ela.learning.patterns import PatternMiner


@pytest.mark.asyncio
async def test_demand_prediction_model_and_ood():
    model = DemandPredictionModel()
    
    # In-distribution test
    res = await model.predict(DemandFeatures(commodity="Tomatoes", month=8, historical_avg_kg=2000.0, active_buyer_inquiries=15))
    assert res.prediction.predicted_demand_kg > 1000
    assert not res.is_out_of_distribution
    assert res.confidence >= 0.85
    assert res.implementation_type == "TRAINED_MACHINE_LEARNING_MODEL"
    assert res.model_status in ["trained", "production"]
    assert "DemandPredictionModel" in res.model_version

    # Out-of-distribution test (extreme volume 45,000 kg)
    res_ood = await model.predict(DemandFeatures(commodity="Tomatoes", month=8, historical_avg_kg=45000.0))
    assert res_ood.is_out_of_distribution
    assert res_ood.confidence < 0.60
    assert res_ood.uncertainty_note is not None


@pytest.mark.asyncio
async def test_price_prediction_model_and_ood():
    model = PricePredictionModel()
    
    # In-distribution test
    res = await model.predict(PriceFeatures(commodity="Tomatoes", grade="A", current_arrivals_tonnes=85.0))
    assert res.prediction.predicted_avg_price > 10.0
    assert res.prediction.min_price < res.prediction.max_price
    assert not res.is_out_of_distribution
    assert res.confidence >= 0.85
    assert res.implementation_type == "TRAINED_MACHINE_LEARNING_MODEL"

    # Out-of-distribution test (extreme historical price Rs 850/kg)
    res_ood = await model.predict(PriceFeatures(commodity="Tomatoes", historical_avg_price=850.0))
    assert res_ood.is_out_of_distribution
    assert res_ood.confidence < 0.50


@pytest.mark.asyncio
async def test_hybrid_eta_and_cost_models():
    eta_model = ETAPredictionModel()
    res_eta = await eta_model.predict(EtaFeatures(origin="Nashik", destination="Pune", distance_km=210.0))
    assert res_eta.prediction.estimated_duration_minutes > 120
    assert res_eta.prediction.baseline_duration_minutes > 0
    assert res_eta.implementation_type == "HYBRID_MODEL"
    assert not res_eta.is_out_of_distribution

    cost_model = TransportCostModel()
    res_cost = await cost_model.predict(TransportCostFeatures(distance_km=210.0, weight_kg=500.0))
    assert res_cost.prediction.estimated_cost > 2000
    assert res_cost.prediction.baseline_tariff_cost > 0
    assert res_cost.implementation_type == "HYBRID_MODEL"


@pytest.mark.asyncio
async def test_multiobjective_vehicle_matching_model():
    model = VehicleMatchingModel()
    vehicles = [
        {"id": "v1", "type": "Mini Truck (750 kg)", "capacity": 750.0, "rating": 4.8},
        {"id": "v2", "type": "Heavy Truck (10 Ton)", "capacity": 10000.0, "rating": 4.2},
    ]
    res = await model.predict(VehicleMatchingFeatures(cargo_weight_kg=500.0, available_vehicles=vehicles))
    assert res.implementation_type == "MULTI_OBJECTIVE_DECISION_MODEL"
    assert res.prediction.total_vehicles_evaluated == 2
    top = res.prediction.top_recommendation
    assert top is not None
    assert top.vehicle_id == "v1"
    assert top.match_score > 0.70


@pytest.mark.asyncio
async def test_model_persistence_checksum_and_loading():
    with tempfile.TemporaryDirectory() as tmpdir:
        fpath = os.path.join(tmpdir, "demand_model.joblib")
        model = DemandPredictionModel(version="v-persist-test")
        sha256 = model.save(fpath)
        assert os.path.exists(fpath)
        assert len(sha256) == 64  # Valid SHA-256 string

        loaded_model = DemandPredictionModel()
        loaded_model.load(fpath)
        assert loaded_model.current_version == "v-persist-test"


@pytest.mark.asyncio
async def test_training_pipeline_and_splits_isolation():
    dataset = SyntheticDataGenerator.generate_demand_dataset(count=100)
    assert len(dataset) == 100
    assert dataset[0]["dataset_type"] == "SYNTHETIC"

    splits = MLTrainingPipeline.split_dataset(dataset, train_ratio=0.70, val_ratio=0.15)
    assert len(splits.train) == 70
    assert len(splits.validation) == 15
    assert len(splits.test) == 15

    # Check zero data overlap between train and test
    train_ids = [id(r) for r in splits.train]
    test_ids = [id(r) for r in splits.test]
    assert set(train_ids).isdisjoint(set(test_ids))

    model = DemandPredictionModel(version="v2.0-trained", status="candidate")
    cycle = await MLTrainingPipeline.run_training_cycle(model, dataset)
    assert cycle["pipeline_status"] == "SUCCESS"
    assert cycle["train_samples"] == 70


@pytest.mark.asyncio
async def test_decision_support_engine_strategy_differentiation():
    engine = DecisionSupportEngine()
    
    vehicles = [
        {"id": "v-cheap", "type": "Mini Truck (750 kg)", "capacity": 750.0, "rating": 4.2},
        {"id": "v-fast", "type": "Pickup Van (1.5 Ton)", "capacity": 1500.0, "rating": 4.9},
    ]

    # Strategy 1: CHEAPEST should prioritize lowest freight cost (Mini Truck)
    res_cheap = await engine.evaluate_transport_options(
        origin="Nashik",
        destination="Pune",
        commodity="Tomatoes",
        weight_kg=500.0,
        available_vehicles=vehicles,
        user_preference="CHEAPEST",
    )
    assert res_cheap.strategy_applied == "CHEAPEST"
    assert res_cheap.recommended_option is not None
    assert res_cheap.recommended_option.vehicle_id == "v-cheap"

    # Strategy 2: FASTEST should prioritize higher speed / faster transit
    res_fast = await engine.evaluate_transport_options(
        origin="Nashik",
        destination="Pune",
        commodity="Tomatoes",
        weight_kg=500.0,
        available_vehicles=vehicles,
        user_preference="FASTEST",
    )
    assert res_fast.strategy_applied == "FASTEST"
    assert res_fast.recommended_option is not None


@pytest.mark.asyncio
async def test_feedback_to_learning_pipeline():
    # 1. Capture actual trip outcome with prediction error
    rec = FeedbackCollector.record_feedback(
        session_id="sess-audit-1",
        action_type="LOGISTICS_TRIP",
        prediction_made={"predicted": 180.0, "features": {"origin": "Nashik", "destination": "Pune", "distance_km": 210.0, "vehicle_type": "Mini Truck"}},
        actual_outcome={"actual": 270.0},
    )
    assert rec.error_delta == 90.0

    cand_data = FeedbackCollector.get_candidate_training_dataset()
    assert len(cand_data) > 0

    # 2. Retrain candidate model using accumulated feedback
    cand_model = ETAPredictionModel(version="v-candidate-feedback", status="candidate")
    retrain_set = [
        {"features": {"origin": "Nashik", "destination": "Pune", "distance_km": 210.0, "vehicle_type": "Mini Truck", "departure_hour": 18, "day_of_week": 2, "loading_time_minutes": 30, "checkpoint_delay_minutes": 15, "historical_error_correction_minutes": 0}, "target": 270.0}
    ] * 10
    train_metrics = await cand_model.train(retrain_set)
    assert train_metrics.sample_count == 10


@pytest.mark.asyncio
async def test_pattern_miner_route_discrepancies():
    records = [
        {"route": "Nashik-Pune", "departure_time": "18:00", "predicted_eta": 180, "actual_eta": 270},
        {"route": "Nashik-Pune", "departure_time": "19:00", "predicted_eta": 180, "actual_eta": 280},
        {"route": "Nashik-Pune", "departure_time": "18:30", "predicted_eta": 180, "actual_eta": 260},
    ]
    patterns = PatternMiner.mine_discrepancies(records)
    assert len(patterns) > 0
    assert patterns[0].pattern_type == "ETA_DISCREPANCY"
    assert patterns[0].average_delay_mins >= 80.0


@pytest.mark.asyncio
async def test_governed_model_evaluator_and_gating():
    active = DemandPredictionModel(version="v1.0-prod", status="production")
    candidate = DemandPredictionModel(version="v2.0-candidate", status="candidate")
    
    test_set = SyntheticDataGenerator.generate_demand_dataset(count=30)
    await candidate.train(test_set)
    
    report = await GovernedModelEvaluator.compare_models(active, candidate, test_set)
    assert report.recommendation in ["PROMOTE_CANDIDATE", "REJECT_CANDIDATE"]
    assert report.active_model_name == "DemandPredictionModel"
    assert report.candidate_model_version == "v2.0-candidate"


@pytest.mark.asyncio
async def test_automated_trainer_execution():
    with tempfile.TemporaryDirectory() as tmpdir:
        results = await train_and_persist_all_models(base_artifact_dir=tmpdir)
        assert "demand" in results
        assert "price" in results
        assert "eta" in results
        assert "transport" in results
        assert "matching" in results
        assert os.path.exists(os.path.join(tmpdir, "demand", "demand_model.joblib"))
        assert os.path.exists(os.path.join(tmpdir, "demand", "metadata.json"))
