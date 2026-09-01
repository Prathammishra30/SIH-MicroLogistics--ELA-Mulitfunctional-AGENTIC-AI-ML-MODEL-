# Live E2E Verification Script for Phase 8.1 Accuracy Hardening
import asyncio
import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=" * 70)
    print("ELA PHASE 8.1 — LIVE E2E ACCURACY HARDENING VERIFICATION")
    print("=" * 70)

    # 1. Test Python Core Direct (/v1/ela/decision/fuse & /v1/ela/chat)
    prompt = "Main farmer hoon. Mujhe 500 kilo tomato Nashik se Pune bhejna hai. Sabse sasta option chahiye."
    print(f"\n[1] User Prompt: '{prompt}'")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Check Health
        h = await client.get("http://127.0.0.1:8000/v1/ela/health")
        print(f"Health Status: {h.status_code} -> {h.json().get('status')}")

        # Chat
        chat_res = await client.post("http://127.0.0.1:8000/v1/ela/chat", json={
            "message": prompt,
            "session_id": "sess-live-8-1-farmer",
            "context": {"role": "FARMER", "language": "hi", "sessionId": "sess-live-8-1-farmer"},
            "user": {"id": "usr-test-farmer-01", "role": "FARMER"}
        })
        chat_data = chat_res.json()
        print(f"\n[2] Agent Chat Response Status: {chat_res.status_code}")
        print(f"    - Message: {chat_data.get('message')}")
        print(f"    - Detected Role: {chat_data.get('detected_role')}")
        print(f"    - Intent: {chat_data.get('intent')}")
        print(f"    - Language: {chat_data.get('language')}")
        print(f"    - Status: {chat_data.get('status')}")
        
        conf_action = chat_data.get('confirmation_action', {})
        print(f"\n[3] Confirmation Action Summary:")
        print(f"    {conf_action.get('summary')}")
        print(f"    Params: {json.dumps(conf_action.get('params', {}), indent=2)}")

        trace = chat_data.get('trace', {})
        print(f"\n[4] Execution Trace:")
        print(f"    - Strategy Extracted: {trace.get('strategy')}")
        print(f"    - Lifecycle Stage: {trace.get('lifecycle_stage')}")
        print(f"    - Models Used: {trace.get('models_used')}")
        print(f"    - Verification Status: {trace.get('verification_status')}")
        print(f"    - Latency: {trace.get('total_latency_ms')} ms")

        # Fusion Decision
        fuse_res = await client.post("http://127.0.0.1:8000/v1/ela/decision/fuse", json={
            "message": prompt,
            "session_id": "sess-live-8-1-farmer",
            "context": {"role": "FARMER", "language": "hi"},
            "user": {"id": "usr-test-farmer-01", "role": "FARMER"}
        })
        fuse_data = fuse_res.json()
        print(f"\n[5] Intelligence Fusion Decision:")
        print(f"    - Confidence: {fuse_data.get('confidence')}")
        print(f"    - Reasoning Summary: {fuse_data.get('reasoning_summary')}")
        print(f"    - Predictions: {json.dumps(fuse_data.get('predictions', {}), indent=2)}")

        # Validate assertions
        assert trace.get('strategy') == 'CHEAPEST', f"Expected CHEAPEST, got {trace.get('strategy')}"
        assert "cheapest" in conf_action.get('summary', '').lower(), "Summary should mention cheapest strategy"
        assert "balanced" not in conf_action.get('summary', '').lower(), "Summary should NOT mention balanced when cheapest was requested"
        print("\n>>> ALL PHASE 8.1 ACCURACY HARDENING ASSERTIONS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    asyncio.run(main())
