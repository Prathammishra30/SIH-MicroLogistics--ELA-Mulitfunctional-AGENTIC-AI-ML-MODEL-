# Reproducible ML Training Pipeline & Dataset Management (Phase 5B Python Core)
import random
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.ml.types import ModelMetrics, ModelStatus


class DatasetSplit(BaseModel):
    train: List[Dict[str, Any]]
    validation: List[Dict[str, Any]]
    test: List[Dict[str, Any]]


class SyntheticDataGenerator:
    """
    Generates synthetic and calibrated historical datasets.
    Clearly marked as synthetic/demo data (dataset_type = 'SYNTHETIC').
    """

    @classmethod
    def generate_demand_dataset(cls, count: int = 150) -> List[Dict[str, Any]]:
        crops = ['Tomatoes', 'Onions', 'Potatoes', 'Wheat']
        data = []
        for _ in range(count):
            crop = random.choice(crops)
            month = random.randint(1, 12)
            buyers = random.randint(5, 30)
            hist_avg = 1500.0 + random.uniform(0, 1000)
            arrivals = 80.0 + random.uniform(0, 150)
            trend_idx = 0.95 + random.uniform(0, 0.25)
            target = (hist_avg * 0.75) - (arrivals * 2.5) + (buyers * 35.0) + (trend_idx * 120.0) + 150.0
            data.append({
                "features": {
                    "commodity": crop,
                    "mandi": "Pune APMC Mandi",
                    "month": month,
                    "day_of_week": random.randint(0, 6),
                    "historical_avg_kg": round(hist_avg, 1),
                    "recent_arrivals_tonnes": round(arrivals, 1),
                    "active_buyer_inquiries": buyers,
                    "price_trend_index": round(trend_idx, 2),
                },
                "target": round(max(500.0, target), 1),
                "dataset_type": "SYNTHETIC",
                "source": "calibrated_agri_mandi_distribution_v1",
            })
        return data

    @classmethod
    def generate_price_dataset(cls, count: int = 150) -> List[Dict[str, Any]]:
        crops = ['Tomatoes', 'Onions', 'Potatoes', 'Wheat']
        grades = ['A', 'B', 'C']
        data = []
        for _ in range(count):
            crop = random.choice(crops)
            grade = random.choice(grades)
            arrivals = 50.0 + random.uniform(0, 200)
            inquiries = 0.90 + random.uniform(0, 0.40)
            hist_p = 35.0 + random.uniform(0, 20)
            target = 4.5 + (0.85 * hist_p) - (0.06 * arrivals) + (5.2 * inquiries)
            data.append({
                "features": {
                    "commodity": crop,
                    "mandi_location": "Pune APMC Mandi",
                    "grade": grade,
                    "current_arrivals_tonnes": round(arrivals, 1),
                    "buyer_inquiry_index": round(inquiries, 2),
                    "historical_avg_price": round(hist_p, 1),
                    "season_month": random.randint(1, 12),
                },
                "target": round(max(10.0, target), 2),
                "dataset_type": "SYNTHETIC",
                "source": "calibrated_hedonic_spot_v1",
            })
        return data

    @classmethod
    def generate_eta_dataset(cls, count: int = 150) -> List[Dict[str, Any]]:
        vehicles = ["Mini Truck (750 kg)", "Pickup Van (1.5 Ton)", "Medium Truck (3.5 Ton)"]
        data = []
        for _ in range(count):
            dist = 40.0 + random.uniform(0, 250)
            v_type = random.choice(vehicles)
            dep_hour = random.randint(6, 22)
            loading = random.choice([20, 30, 45])
            checkpoint = random.choice([10, 15, 30])
            traffic = 25 if dep_hour in [8, 9, 17, 18, 19] else 10
            base_dur = 12.0 + (dist * 1.25) - (0.4 * 48.0) + (0.95 * loading) + (1.05 * checkpoint) + traffic
            data.append({
                "features": {
                    "origin": "Nashik",
                    "destination": "Pune APMC Mandi",
                    "distance_km": round(dist, 1),
                    "vehicle_type": v_type,
                    "departure_hour": dep_hour,
                    "day_of_week": random.randint(0, 6),
                    "loading_time_minutes": loading,
                    "checkpoint_delay_minutes": checkpoint,
                    "historical_error_correction_minutes": 0,
                },
                "target": round(max(30.0, base_dur), 1),
                "dataset_type": "SYNTHETIC",
                "source": "calibrated_transit_kinematics_v1",
            })
        return data


class MLTrainingPipeline:
    """
    Standardized, reproducible model training pipeline:
    Raw Data -> Validation -> Cleaning -> Feature Engineering -> Train/Val Split -> Training -> Evaluation -> Gate -> Promotion
    """

    @classmethod
    def validate_and_clean_data(cls, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned = []
        for row in raw_data:
            feats = row.get("features", {})
            target = row.get("target")
            if target is not None and float(target) > 0 and feats:
                cleaned.append(row)
        return cleaned

    @classmethod
    def split_dataset(cls, dataset: List[Dict[str, Any]], train_ratio: float = 0.70, val_ratio: float = 0.15) -> DatasetSplit:
        shuffled = list(dataset)
        random.seed(42)
        random.shuffle(shuffled)
        n = len(shuffled)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)

        return DatasetSplit(
            train=shuffled[:n_train],
            validation=shuffled[n_train:n_train + n_val],
            test=shuffled[n_train + n_val:],
        )

    @classmethod
    async def run_training_cycle(
        cls,
        model_instance: Any,
        raw_data: List[Dict[str, Any]],
        mae_threshold: float = 250.0,
    ) -> Dict[str, Any]:
        start_time = datetime.now().isoformat()

        # 1. Validation & Cleaning
        cleaned = cls.validate_and_clean_data(raw_data)

        # 2. Train/Validation Split
        splits = cls.split_dataset(cleaned)

        # 3. Training
        train_metrics: ModelMetrics = await model_instance.train(splits.train)

        # 4. Evaluation on Validation Set
        val_metrics: ModelMetrics = await model_instance.evaluate(splits.validation)

        # 5. Governance Promotion Gate
        status: ModelStatus = "candidate"
        promoted = False
        if val_metrics.mae <= mae_threshold:
            status = "trained"
            promoted = True

        return {
            "model_name": model_instance.model_name,
            "version": model_instance.current_version,
            "pipeline_status": "SUCCESS",
            "train_samples": len(splits.train),
            "val_samples": len(splits.validation),
            "test_samples": len(splits.test),
            "training_metrics": train_metrics.model_dump(),
            "validation_metrics": val_metrics.model_dump(),
            "promoted_to_trained": promoted,
            "new_status": status,
            "timestamp": start_time,
        }
