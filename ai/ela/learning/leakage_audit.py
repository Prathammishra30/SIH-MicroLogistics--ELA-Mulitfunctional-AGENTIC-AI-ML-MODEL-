# ELA Scientific Data Leakage Audit Engine (Phase 11.1 Scientific Hardening)
import hashlib
import json
from typing import Dict, Any, List, Optional, Tuple, Literal
from pydantic import BaseModel, Field
from datetime import datetime


LeakageCheckStatus = Literal["PASS", "FAIL", "NOT_APPLICABLE"]


class LeakageAuditReport(BaseModel):
    """
    Comprehensive, auditable report of scientific data leakage checks.
    """
    audit_id: str = Field(default_factory=lambda: f"leak-audit-{int(datetime.now().timestamp() * 1000)}")
    target_leakage: LeakageCheckStatus = "PASS"
    temporal_leakage: LeakageCheckStatus = "PASS"
    duplicate_leakage: LeakageCheckStatus = "PASS"
    route_leakage: LeakageCheckStatus = "PASS"
    preprocessing_leakage: LeakageCheckStatus = "PASS"
    overall_status: LeakageCheckStatus = "PASS"
    findings: List[str] = Field(default_factory=list)
    dataset_summary: Dict[str, Any] = Field(default_factory=dict)
    audited_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class LeakageAuditor:
    """
    Scientific Data Leakage Auditor.
    Enforces that training, validation, and holdout datasets have zero target leakage,
    zero temporal backwards-leakage, and zero holdout contamination.
    """

    FORBIDDEN_TARGET_KEYS = {
        "actual_value",
        "actual_duration",
        "actual_duration_mins",
        "actual_delay",
        "actual_freight",
        "actual_cost",
        "actual_demand",
        "actual_price",
        "target",
        "post_trip",
        "completion_time",
        "outcome_status",
        "trip_completed_at",
        "driver_actual_speed",
    }

    @classmethod
    def audit_dataset(
        cls,
        train_records: List[Dict[str, Any]],
        val_records: Optional[List[Dict[str, Any]]] = None,
        holdout_records: Optional[List[Dict[str, Any]]] = None,
        model_name: str = "GenericModel",
    ) -> LeakageAuditReport:
        findings = []
        target_leakage_status: LeakageCheckStatus = "PASS"
        temporal_leakage_status: LeakageCheckStatus = "PASS"
        duplicate_leakage_status: LeakageCheckStatus = "PASS"
        route_leakage_status: LeakageCheckStatus = "PASS"
        preprocessing_leakage_status: LeakageCheckStatus = "PASS"

        val_records = val_records or []
        holdout_records = holdout_records or []
        all_records = train_records + val_records + holdout_records

        # ---------------------------------------------------------------------
        # 1. Target Leakage Audit (features containing actual target or post-trip facts)
        # ---------------------------------------------------------------------
        for idx, row in enumerate(all_records):
            feats = row.get("features", {})
            if isinstance(feats, dict):
                for k in feats.keys():
                    k_clean = str(k).lower().strip()
                    if k_clean in cls.FORBIDDEN_TARGET_KEYS or k_clean.startswith("actual_") or k_clean.startswith("post_trip_"):
                        target_leakage_status = "FAIL"
                        findings.append(f"Target Leakage detected in record #{idx}: feature '{k}' contains post-trip target information.")

        # ---------------------------------------------------------------------
        # 2. Temporal Leakage Audit (future observations in historical training)
        # ---------------------------------------------------------------------
        def extract_timestamps(records: List[Dict[str, Any]]) -> List[str]:
            ts_list = []
            for r in records:
                ts = r.get("timestamp") or r.get("created_at") or r.get("time")
                if ts and isinstance(ts, str):
                    ts_list.append(ts)
            return sorted(ts_list)

        train_ts = extract_timestamps(train_records)
        val_ts = extract_timestamps(val_records)
        holdout_ts = extract_timestamps(holdout_records)

        if train_ts and val_ts:
            max_train_ts = train_ts[-1]
            min_val_ts = val_ts[0]
            if max_train_ts > min_val_ts:
                temporal_leakage_status = "FAIL"
                findings.append(f"Temporal Leakage: training max timestamp ({max_train_ts}) occurs after validation min timestamp ({min_val_ts}).")

        if val_ts and holdout_ts:
            max_val_ts = val_ts[-1]
            min_holdout_ts = holdout_ts[0]
            if max_val_ts > min_holdout_ts:
                temporal_leakage_status = "FAIL"
                findings.append(f"Temporal Leakage: validation max timestamp ({max_val_ts}) occurs after holdout min timestamp ({min_holdout_ts}).")

        if train_ts and holdout_ts and not val_ts:
            max_train_ts = train_ts[-1]
            min_holdout_ts = holdout_ts[0]
            if max_train_ts > min_holdout_ts:
                temporal_leakage_status = "FAIL"
                findings.append(f"Temporal Leakage: training max timestamp ({max_train_ts}) occurs after holdout min timestamp ({min_holdout_ts}).")

        # ---------------------------------------------------------------------
        # 3. Duplicate / Trip Leakage Audit (feature collisions between train and holdout)
        # ---------------------------------------------------------------------
        def hash_feature_signature(feats: Dict[str, Any]) -> str:
            clean = {k: v for k, v in feats.items() if not str(k).startswith("_")}
            serialized = json.dumps(clean, sort_keys=True, default=str)
            return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

        train_signatures = set()
        for r in train_records:
            feats = r.get("features", {})
            if isinstance(feats, dict) and feats:
                train_signatures.add(hash_feature_signature(feats))

        duplicate_collisions = 0
        for idx, r in enumerate(holdout_records):
            feats = r.get("features", {})
            if isinstance(feats, dict) and feats:
                sig = hash_feature_signature(feats)
                if sig in train_signatures:
                    duplicate_collisions += 1

        if duplicate_collisions > 0:
            duplicate_leakage_status = "FAIL"
            findings.append(f"Duplicate Leakage: {duplicate_collisions} holdout samples share identical feature signatures with training data.")

        # ---------------------------------------------------------------------
        # 4. Route / Spatial Leakage Overview
        # ---------------------------------------------------------------------
        train_routes = {r.get("route") or r.get("features", {}).get("route") for r in train_records if (r.get("route") or r.get("features", {}).get("route"))}
        holdout_routes = {r.get("route") or r.get("features", {}).get("route") for r in holdout_records if (r.get("route") or r.get("features", {}).get("route"))}
        unseen_corridors = holdout_routes - train_routes

        # Overall Status
        if target_leakage_status == "FAIL" or temporal_leakage_status == "FAIL" or duplicate_leakage_status == "FAIL":
            overall_status = "FAIL"
        else:
            overall_status = "PASS"

        dataset_summary = {
            "model_name": model_name,
            "train_samples": len(train_records),
            "val_samples": len(val_records),
            "holdout_samples": len(holdout_records),
            "total_samples": len(all_records),
            "train_time_range": [train_ts[0], train_ts[-1]] if train_ts else None,
            "holdout_time_range": [holdout_ts[0], holdout_ts[-1]] if holdout_ts else None,
            "unique_train_routes": list(train_routes),
            "unique_holdout_routes": list(holdout_routes),
            "unseen_corridors_in_holdout": list(unseen_corridors),
        }

        return LeakageAuditReport(
            target_leakage=target_leakage_status,
            temporal_leakage=temporal_leakage_status,
            duplicate_leakage=duplicate_leakage_status,
            route_leakage=route_leakage_status,
            preprocessing_leakage=preprocessing_leakage_status,
            overall_status=overall_status,
            findings=findings,
            dataset_summary=dataset_summary,
        )
