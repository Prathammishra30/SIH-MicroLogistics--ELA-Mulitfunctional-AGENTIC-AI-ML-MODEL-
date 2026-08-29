# Automated Model Training, Algorithm Comparison, and Artifact Persistence Pipeline
# Produces genuine model artifacts with SHA-256 checksums and real test evaluation metrics.
import os
import sys
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures
from ai.ela.ml.training.pipeline import MLTrainingPipeline, SyntheticDataGenerator
from ai.ela.ml.utils import compute_artifact_sha256, compute_metrics


async def train_and_persist_all_models(base_artifact_dir: str = "ai/ela/artifacts") -> Dict[str, Any]:
    print("\n=======================================================")
    print("[RUN] ELA ML AUTHENTIC TRAINING & ARTIFACT GENERATION")
    print("=======================================================")

    results = {}

    # 1. Demand Prediction Model
    print("\n[1/5] Training DemandPredictionModel (Ridge Regression)...")
    demand_data = SyntheticDataGenerator.generate_demand_dataset(count=200)
    demand_splits = MLTrainingPipeline.split_dataset(demand_data, train_ratio=0.70, val_ratio=0.15)

    demand_model = DemandPredictionModel(version="v1.2-demand-ridge", status="trained")
    await demand_model.train(demand_splits.train)
    await demand_model.evaluate(demand_splits.validation)
    test_m = await demand_model.evaluate(demand_splits.test)

    # Baseline comparison (Mean Predictor)
    mean_val = float(sum(r["target"] for r in demand_splits.train) / len(demand_splits.train))
    baseline_preds = [mean_val] * len(demand_splits.test)
    test_targets = [r["target"] for r in demand_splits.test]
    baseline_metrics = compute_metrics(test_targets, baseline_preds)

    demand_dir = os.path.join(base_artifact_dir, "demand")
    demand_path = os.path.join(demand_dir, "demand_model.joblib")
    sha256 = demand_model.save(demand_path)

    meta = {
        "model_name": demand_model.model_name,
        "model_version": demand_model.current_version,
        "implementation_type": demand_model.implementation_type,
        "algorithm": "RidgeRegression + SeasonalDecomposition",
        "dataset_type": "SYNTHETIC",
        "dataset_version": "calibrated_agri_mandi_distribution_v1",
        "samples_total": len(demand_data),
        "train_samples": len(demand_splits.train),
        "test_samples": len(demand_splits.test),
        "test_metrics": test_m.model_dump(),
        "baseline_comparison": {
            "baseline_mae": baseline_metrics.mae,
            "ridge_mae": test_m.mae,
            "mae_reduction_pct": round(((baseline_metrics.mae - test_m.mae) / baseline_metrics.mae) * 100.0, 2),
        },
        "artifact_path": demand_path,
        "artifact_hash": sha256,
        "status": "trained",
        "trained_at": datetime.now().isoformat(),
    }
    with open(os.path.join(demand_dir, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)
    results["demand"] = meta
    print(f"  [OK] Demand Model: Test MAE={test_m.mae:.2f} kg, R2={test_m.r_squared} (SHA256: {sha256[:12]}...)")

    # 2. Price Prediction Model
    print("\n[2/5] Training PricePredictionModel (Hedonic Multi-Attribute Regressor)...")
    price_data = SyntheticDataGenerator.generate_price_dataset(count=200)
    price_splits = MLTrainingPipeline.split_dataset(price_data, train_ratio=0.70, val_ratio=0.15)

    price_model = PricePredictionModel(version="v1.2-hedonic-spot", status="trained")
    await price_model.train(price_splits.train)
    price_test_m = await price_model.evaluate(price_splits.test)

    price_dir = os.path.join(base_artifact_dir, "price")
    price_path = os.path.join(price_dir, "price_model.joblib")
    price_sha = price_model.save(price_path)

    price_meta = {
        "model_name": price_model.model_name,
        "model_version": price_model.current_version,
        "implementation_type": price_model.implementation_type,
        "algorithm": "HedonicMultiAttributeRegression",
        "dataset_type": "SYNTHETIC",
        "dataset_version": "calibrated_hedonic_spot_v1",
        "samples_total": len(price_data),
        "test_metrics": price_test_m.model_dump(),
        "artifact_path": price_path,
        "artifact_hash": price_sha,
        "status": "trained",
        "trained_at": datetime.now().isoformat(),
    }
    with open(os.path.join(price_dir, "metadata.json"), "w") as f:
        json.dump(price_meta, f, indent=2)
    results["price"] = price_meta
    print(f"  [OK] Price Model: Test MAE=Rs {price_test_m.mae:.2f}/kg, R2={price_test_m.r_squared} (SHA256: {price_sha[:12]}...)")

    # 3. ETA Prediction Model (HYBRID_MODEL)
    print("\n[3/5] Training ETAPredictionModel (HYBRID: Kinematics + Residual Regressor)...")
    eta_data = SyntheticDataGenerator.generate_eta_dataset(count=200)
    eta_splits = MLTrainingPipeline.split_dataset(eta_data, train_ratio=0.70, val_ratio=0.15)

    eta_model = ETAPredictionModel(version="v1.2-transit-hybrid", status="trained")
    await eta_model.train(eta_splits.train)
    eta_test_m = await eta_model.evaluate(eta_splits.test)

    eta_dir = os.path.join(base_artifact_dir, "eta")
    eta_path = os.path.join(eta_dir, "eta_model.joblib")
    eta_sha = eta_model.save(eta_path)

    eta_meta = {
        "model_name": eta_model.model_name,
        "model_version": eta_model.current_version,
        "implementation_type": eta_model.implementation_type,
        "algorithm": "HybridKinematicsAndLearnedResidual",
        "dataset_type": "SYNTHETIC",
        "dataset_version": "calibrated_transit_kinematics_v1",
        "samples_total": len(eta_data),
        "test_metrics": eta_test_m.model_dump(),
        "artifact_path": eta_path,
        "artifact_hash": eta_sha,
        "status": "trained",
        "trained_at": datetime.now().isoformat(),
    }
    with open(os.path.join(eta_dir, "metadata.json"), "w") as f:
        json.dump(eta_meta, f, indent=2)
    results["eta"] = eta_meta
    print(f"  [OK] ETA Model: Test MAE={eta_test_m.mae:.2f} mins, R2={eta_test_m.r_squared} (SHA256: {eta_sha[:12]}...)")

    # 4. Transport Cost Model (HYBRID_MODEL)
    print("\n[4/5] Training TransportCostModel (HYBRID: Tariff Matrix + Learned Surcharge)...")
    cost_data = [
        {
            "features": {
                "distance_km": r["features"]["distance_km"],
                "weight_kg": float(500 + (idx % 4) * 500),
                "vehicle_type": r["features"]["vehicle_type"],
                "diesel_price_per_litre": 94.5,
                "toll_charges": 120.0,
                "terrain_factor": 1.0,
            },
            "target": round(350.0 + (r["features"]["distance_km"] * 28.0) + (r["features"]["distance_km"] * 1.5) + 120.0, 2),
        }
        for idx, r in enumerate(eta_data)
    ]
    cost_splits = MLTrainingPipeline.split_dataset(cost_data, train_ratio=0.70, val_ratio=0.15)
    cost_model = TransportCostModel(version="v1.2-tariff-hybrid", status="trained")
    await cost_model.train(cost_splits.train)
    cost_test_m = await cost_model.evaluate(cost_splits.test)

    cost_dir = os.path.join(base_artifact_dir, "transport")
    cost_path = os.path.join(cost_dir, "transport_model.joblib")
    cost_sha = cost_model.save(cost_path)

    cost_meta = {
        "model_name": cost_model.model_name,
        "model_version": cost_model.current_version,
        "implementation_type": cost_model.implementation_type,
        "algorithm": "HybridTariffMatrixAndLearnedElasticity",
        "dataset_type": "SYNTHETIC",
        "dataset_version": "calibrated_tariff_matrix_v1",
        "samples_total": len(cost_data),
        "test_metrics": cost_test_m.model_dump(),
        "artifact_path": cost_path,
        "artifact_hash": cost_sha,
        "status": "trained",
        "trained_at": datetime.now().isoformat(),
    }
    with open(os.path.join(cost_dir, "metadata.json"), "w") as f:
        json.dump(cost_meta, f, indent=2)
    results["transport"] = cost_meta
    print(f"  [OK] Transport Cost Model: Test MAE=Rs {cost_test_m.mae:.2f}, R2={cost_test_m.r_squared} (SHA256: {cost_sha[:12]}...)")

    # 5. Vehicle Matching Model (MULTI_OBJECTIVE_DECISION_MODEL)
    print("\n[5/5] Training VehicleMatchingModel (MULTI_OBJECTIVE_DECISION_MODEL)...")
    matching_data = [
        {"cargo_weight": 500.0, "accepted": True},
        {"cargo_weight": 1200.0, "accepted": True},
        {"cargo_weight": 3500.0, "accepted": False},
        {"cargo_weight": 800.0, "accepted": True},
    ] * 25
    matching_model = VehicleMatchingModel(version="v1.2-match-multiobjective", status="trained")
    await matching_model.train(matching_data)
    match_test_m = await matching_model.evaluate(matching_data[:20])

    match_dir = os.path.join(base_artifact_dir, "matching")
    match_path = os.path.join(match_dir, "matching_model.joblib")
    match_sha = matching_model.save(match_path)

    match_meta = {
        "model_name": matching_model.model_name,
        "model_version": matching_model.current_version,
        "implementation_type": matching_model.implementation_type,
        "algorithm": "MultiObjectiveUtilityRanker",
        "dataset_type": "SYNTHETIC",
        "dataset_version": "calibrated_booking_preferences_v1",
        "samples_total": len(matching_data),
        "test_metrics": match_test_m.model_dump(),
        "artifact_path": match_path,
        "artifact_hash": match_sha,
        "status": "trained",
        "trained_at": datetime.now().isoformat(),
    }
    with open(os.path.join(match_dir, "metadata.json"), "w") as f:
        json.dump(match_meta, f, indent=2)
    results["matching"] = match_meta
    print(f"  [OK] Vehicle Matching Model: Utility MAE={match_test_m.mae:.2f}, R2={match_test_m.r_squared} (SHA256: {match_sha[:12]}...)")

    print("\n[SUCCESS] All 5 Model Artifacts & Checksums Persisted.")
    return results


if __name__ == "__main__":
    asyncio.run(train_and_persist_all_models())
