# Phase 6 ELA Intelligence Fusion Validation Script
import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def main():
    base_url = "http://127.0.0.1:8000/v1/ela"
    
    print("=" * 60)
    print("1. HEALTH CHECK")
    print("=" * 60)
    res = requests.get(f"{base_url}/health")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    print("\n" + "=" * 60)
    print("2. STRUCTURED INTELLIGENCE FUSION (HINDI FARMER LOGISTICS)")
    print("=" * 60)
    payload = {
        "message": "Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta option chahiye.",
        "user": {
            "id": "usr-farmer-101",
            "role": "FARMER"
        },
        "context": {
            "language": "hi",
            "role": "FARMER"
        },
        "session_id": "sess-fuse-live-1"
    }
    fuse_res = requests.post(f"{base_url}/decision/fuse", json=payload)
    print("Status:", fuse_res.status_code)
    data = fuse_res.json()
    print("Intent:", data.get("intent"))
    print("Role:", data.get("role"))
    print("Language:", data.get("language"))
    print("Entities:", data.get("entities"))
    print("Confidence:", data.get("confidence"))
    print("Reasoning Summary:", data.get("reasoning_summary"))
    print("Requires Confirmation:", data.get("requires_confirmation"))
    print("Recommended Action:", json.dumps(data.get("recommended_action"), indent=2))
    print("Predictions:", json.dumps(data.get("predictions"), indent=2))
    print("Neural Insights:", json.dumps(data.get("neural_insights"), indent=2))
    print("Options Count:", len(data.get("options", [])))

    print("\n" + "=" * 60)
    print("3. ERROR ANALYSIS & MODEL DISCREPANCY DIAGNOSIS")
    print("=" * 60)
    err_payload = {
        "discrepancy_id": "disc-live-01",
        "session_id": "sess-live-01",
        "model_name": "ETAPredictionModel",
        "model_version": "v1.2",
        "target_metric": "ETA_MINUTES",
        "predicted_value": 348.0,
        "actual_value": 490.0,
        "error_delta": 142.0,
        "error_percentage": 40.8,
        "route": "Nashik-Pune-Ghats",
        "weather_context": "Severe Monsoon Landslide on ghat section"
    }
    err_res = requests.post(f"{base_url}/learning/error-analysis", json=err_payload)
    print("Error Diagnosis:", json.dumps(err_res.json(), indent=2))

    print("\n" + "=" * 60)
    print("4. OPERATIONAL RISK PREDICTIONS")
    print("=" * 60)
    delay_res = requests.post(f"{base_url}/predict/delay-risk", json={
        "distance_km": 210.0,
        "departure_hour": 18,
        "weather_risk_index": 0.35,
        "checkpoint_count": 2
    })
    print("Delay Risk:", json.dumps(delay_res.json()["prediction"], indent=2))

    success_res = requests.post(f"{base_url}/predict/delivery-success", json={
        "distance_km": 210.0,
        "cargo_weight_kg": 500.0,
        "vehicle_capacity_kg": 750.0,
        "transporter_reliability_score": 0.95,
        "delay_risk": 0.15,
        "cancellation_risk": 0.05
    })
    print("Delivery Success Composite:", json.dumps(success_res.json()["prediction"], indent=2))

if __name__ == "__main__":
    main()
