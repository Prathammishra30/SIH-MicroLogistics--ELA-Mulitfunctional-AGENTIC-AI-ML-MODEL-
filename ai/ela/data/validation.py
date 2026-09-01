# Data Quality Validation & Anti-Leakage Engine (Phase 7 Real-World Learning & Continuous Intelligence)
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from ai.ela.data.schemas import LearningEvent, DataQualityReport


class DataQualityValidator:
    """
    Validates operational datasets prior to feature engineering and candidate model training.
    Enforces strict typing, range validity, anti-leakage checks, and chronological temporal ordering.
    """

    TARGET_LEAKAGE_KEYS = {
        "actual_value", "actual_cost", "actual_eta", "actual_duration",
        "final_settled_freight", "trip_duration_minutes", "cancellation_occurred",
        "actual_outcome", "actual_demand_kg", "actual_spot_price"
    }

    @classmethod
    def validate_dataset(
        cls,
        records: List[Dict[str, Any]],
        target_field: str = "actual_value",
        allow_synthetic: bool = True,
    ) -> Tuple[List[Dict[str, Any]], DataQualityReport]:
        if not records:
            return [], DataQualityReport(
                total_records_checked=0,
                valid_records_count=0,
                invalid_records_count=0,
                outliers_detected=0,
                leakage_detected=False,
                temporal_order_valid=True,
                validation_status="FAILED",
                issues=["Dataset is empty. Insufficient data for validation or training."],
            )

        valid_records: List[Dict[str, Any]] = []
        issues: List[str] = []
        outliers_count = 0
        leakage_detected = False
        temporal_valid = True

        seen_keys = set()
        timestamps = []

        for idx, rec in enumerate(records):
            # 1. Check for duplicate records
            rec_id = rec.get("event_id", f"rec-{idx}")
            features = rec.get("features", {})
            feat_tuple = tuple(sorted(str((k, v)) for k, v in features.items()))
            if feat_tuple in seen_keys:
                issues.append(f"Row {idx}: Duplicate feature signature detected and pruned.")
                continue
            seen_keys.add(feat_tuple)

            # 2. Check for target leakage in features
            leaked_keys = [k for k in features.keys() if k.lower() in cls.TARGET_LEAKAGE_KEYS]
            if leaked_keys:
                leakage_detected = True
                issues.append(f"Row {idx}: Target leakage detected in features: {leaked_keys}")
                continue

            # 3. Check for impossible / non-positive values
            is_valid_values = True
            for k, v in features.items():
                if isinstance(v, (int, float)):
                    if "distance" in k.lower() and v <= 0:
                        is_valid_values = False
                        issues.append(f"Row {idx}: Impossible non-positive distance ({v} km).")
                    elif "weight" in k.lower() and v <= 0:
                        is_valid_values = False
                        issues.append(f"Row {idx}: Impossible non-positive weight ({v} kg).")
                    elif "price" in k.lower() and v <= 0:
                        is_valid_values = False
                        issues.append(f"Row {idx}: Impossible non-positive price ({v}).")

            if not is_valid_values:
                continue

            # 4. Check target value validity
            target_val = rec.get(target_field)
            if target_val is None or not isinstance(target_val, (int, float)) or np.isnan(target_val):
                issues.append(f"Row {idx}: Missing or invalid numerical target '{target_field}'.")
                continue

            if target_val < 0:
                issues.append(f"Row {idx}: Impossible negative target value ({target_val}).")
                continue

            # 5. Outlier Detection (Z-score heuristic or hard range check)
            if target_val > 100000.0:  # Hard extreme anomaly
                outliers_count += 1
                issues.append(f"Row {idx}: Extreme outlier target value ({target_val}) filtered.")
                continue

            # 6. Timestamp parsing for temporal order check
            ts_str = rec.get("timestamp")
            if ts_str:
                try:
                    ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    timestamps.append(ts)
                except Exception:
                    pass

            valid_records.append(rec)

        # Verify temporal monotonicity if timestamps are present
        if len(timestamps) > 1:
            for i in range(1, len(timestamps)):
                if timestamps[i] < timestamps[i - 1]:
                    temporal_valid = False
                    issues.append("Temporal ordering violation: dataset contains out-of-order chronological records.")
                    break

        status = "PASSED"
        if leakage_detected or len(valid_records) == 0:
            status = "FAILED"
        elif len(issues) > 0 or not temporal_valid:
            status = "WARNING"

        report = DataQualityReport(
            total_records_checked=len(records),
            valid_records_count=len(valid_records),
            invalid_records_count=len(records) - len(valid_records),
            outliers_detected=outliers_count,
            leakage_detected=leakage_detected,
            temporal_order_valid=temporal_valid,
            validation_status=status,
            issues=issues[:10],  # Top 10 issues
        )

        return valid_records, report

    @classmethod
    def temporal_train_test_split(
        cls,
        records: List[Dict[str, Any]],
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        holdout_ratio: float = 0.15,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Performs strict chronological temporal split to prevent future lookahead data leakage.
        """
        if not records:
            return [], [], []

        # Sort by timestamp if available
        sorted_records = sorted(
            records,
            key=lambda r: r.get("timestamp", "1970-01-01T00:00:00")
        )

        n = len(sorted_records)
        train_end = int(n * train_ratio)
        val_end = train_end + int(n * val_ratio)

        train_set = sorted_records[:train_end]
        val_set = sorted_records[train_end:val_end]
        holdout_set = sorted_records[val_end:]

        # Mark partitions
        for r in train_set:
            r["dataset_partition"] = "TRAIN"
        for r in val_set:
            r["dataset_partition"] = "VALIDATION"
        for r in holdout_set:
            r["dataset_partition"] = "HOLDOUT"

        return train_set, val_set, holdout_set
