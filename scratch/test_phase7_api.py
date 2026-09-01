# Phase 7 ELA Real-World Learning & Continuous Intelligence API Validation
import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def main():
    base_url = "http://127.0.0.1:8000/v1/ela"
    
    print("=" * 60)
    print("1. SERVICE HEALTH & PHASE 7 LEARNING STATUS")
    print("=" * 60)
    health = requests.get(f"{base_url}/health").json()
    print("Health Status:", health.get("status"))
    print("Version:", health.get("version"))
    print("Learning Subsystems:", json.dumps(health.get("learning"), indent=2))

    print("\n" + "=" * 60)
    print("2. INGEST OPERATIONAL LEARNING EVENTS")
    print("=" * 60)
    event_payload = {
        "event_id": "event-live-101",
        "operation_type": "LOGISTICS_TRIP",
        "prediction_type": "ETA_MINUTES",
        "features": {
            "distance_km": 210.0,
            "departure_hour": 18,
            "route": "Nashik-Pune"
        },
        "predicted_value": 348.0,
        "actual_value": 395.0,
        "user_role": "FARMER",
        "route_context": "Nashik-Pune",
        "model_name": "ETAPredictionModel",
        "model_version": "v1.2",
        "confidence": 0.93,
        "dataset_type": "REAL_OPERATIONAL",
        "dataset_partition": "TRAIN"
    }
    event_res = requests.post(f"{base_url}/learning/event", json=event_payload)
    print("Event Ingest Status:", event_res.status_code)
    print("Ingested Event:", json.dumps(event_res.json(), indent=2))

    print("\n" + "=" * 60)
    print("3. MODEL REGISTRY LISTING & IMMUTABLE METADATA")
    print("=" * 60)
    models_res = requests.get(f"{base_url}/models").json()
    print("Registered Models Count:", models_res.get("total_count"))
    for m in models_res.get("models", [])[:3]:
        print(f" - {m['model_name']} ({m['current_version']}, {m['status']})")

    print("\n" + "=" * 60)
    print("4. DRIFT ANALYSIS ON TELEMETRY STREAMS")
    print("=" * 60)
    drift_res = requests.get(f"{base_url}/learning/drift?model_name=ETAPredictionModel").json()
    print("Drift Type:", drift_res.get("drift_type"))
    print("Retraining Warranted:", drift_res.get("is_retraining_warranted"))
    print("Summary:", drift_res.get("summary"))

    print("\n" + "=" * 60)
    print("5. GOVERNED CANDIDATE EVALUATION & PROMOTION")
    print("=" * 60)
    eval_res = requests.post(f"{base_url}/models/DemandPredictionModel/evaluate").json()
    print("Evaluation Report:", json.dumps(eval_res, indent=2))

    promote_res = requests.post(f"{base_url}/models/DemandPredictionModel/promote").json()
    print("Promotion Result:", json.dumps(promote_res, indent=2))

    print("\n" + "=" * 60)
    print("6. MODEL ROLLBACK AUDIT TRAIL")
    print("=" * 60)
    rollback_res = requests.post(f"{base_url}/models/DemandPredictionModel/rollback", json={
        "target_version": "v1.2-demand-ridge"
    }).json()
    print("Rollback Status:", json.dumps(rollback_res, indent=2))

    print("\n" + "=" * 60)
    print("7. ELA ACTIVE DECISION FUSION WITH PROMOTED/ROLLED BACK MODEL")
    print("=" * 60)
    chat_payload = {
        "message": "Tomatoes ki mandi demand aur price forecast kya hai?",
        "user": {"id": "usr-1", "role": "FARMER"},
        "context": {"language": "hi", "role": "FARMER"}
    }
    fuse_res = requests.post(f"{base_url}/decision/fuse", json=chat_payload).json()
    print("Decision Intent:", fuse_res.get("intent"))
    print("Confidence:", fuse_res.get("confidence"))
    print("Reasoning Summary:", fuse_res.get("reasoning_summary"))
    print("Predictions:", json.dumps(fuse_res.get("predictions"), indent=2))

if __name__ == "__main__":
    main()
