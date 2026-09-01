# Live Multi-Agent E2E Verification Script for Phase 9
import asyncio
import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=" * 75)
    print("ELA PHASE 9 — UNIVERSAL MULTI-AGENT INTELLIGENCE & AUTONOMOUS ORCHESTRATION")
    print("=" * 75)

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Health Check
        h = await client.get("http://127.0.0.1:8000/v1/ela/health")
        print(f"\n[1] Python ELA Health: {h.status_code} -> {h.json().get('status')}")

        # 2. Live Farmer Multi-Agent Orchestration
        farmer_prompt = "Main farmer hoon. Mujhe 500 kilo tomato Nashik se Pune bhejna hai. Sabse sasta option chahiye."
        print(f"\n[2] Testing Farmer Prompt: '{farmer_prompt}'")
        f_resp = await client.post("http://127.0.0.1:8000/v1/ela/chat", json={
            "message": farmer_prompt,
            "session_id": "sess-live-p9-farmer",
            "context": {"role": "FARMER", "language": "hi", "sessionId": "sess-live-p9-farmer"},
            "user": {"id": "usr-test-farmer-p9", "role": "FARMER"}
        })
        f_data = f_resp.json()
        print(f"    - Status Code: {f_resp.status_code}")
        print(f"    - Response Status: {f_data.get('status')}")
        print(f"    - Detected Role: {f_data.get('detected_role')}")
        print(f"    - Language: {f_data.get('language')}")
        print(f"    - Message: {f_data.get('message')}")
        
        trace = f_data.get('trace', {})
        print(f"    - Strategy: {trace.get('strategy')}")
        print(f"    - Models Used: {trace.get('models_used')}")
        print(f"    - Decision Trace: {json.dumps(trace.get('decision_trace', {}), indent=2)}")

        # 3. Live Buyer Multi-Agent Orchestration
        buyer_prompt = "I am a buyer. Find me 2 tonnes of tomatoes near Pune and recommend the best procurement option."
        print(f"\n[3] Testing Buyer Prompt: '{buyer_prompt}'")
        b_resp = await client.post("http://127.0.0.1:8000/v1/ela/chat", json={
            "message": buyer_prompt,
            "session_id": "sess-live-p9-buyer",
            "context": {"role": "BUYER", "language": "en", "sessionId": "sess-live-p9-buyer"},
            "user": {"id": "usr-test-buyer-p9", "role": "BUYER"}
        })
        b_data = b_resp.json()
        print(f"    - Status Code: {b_resp.status_code}")
        print(f"    - Response Status: {b_data.get('status')}")
        print(f"    - Confirmation Action: {json.dumps(b_data.get('confirmation_action', {}), indent=2)}")

        # 4. Live Transporter Multi-Agent Orchestration (Marathi)
        trans_prompt = "मी ट्रान्सपोर्टर आहे. माझ्या 5 टन ट्रकसाठी उपलब्ध ट्रिप शोधा."
        print(f"\n[4] Testing Transporter Prompt: '{trans_prompt}'")
        t_resp = await client.post("http://127.0.0.1:8000/v1/ela/chat", json={
            "message": trans_prompt,
            "session_id": "sess-live-p9-trans",
            "context": {"role": "TRANSPORTER", "language": "mr", "sessionId": "sess-live-p9-trans"},
            "user": {"id": "usr-test-trans-p9", "role": "TRANSPORTER"}
        })
        t_data = t_resp.json()
        print(f"    - Status Code: {t_resp.status_code}")
        print(f"    - Response Status: {t_data.get('status')}")
        print(f"    - Message: {t_data.get('message')}")

        # Assertions
        assert f_data.get('detected_role') == 'FARMER'
        assert trace.get('strategy') == 'CHEAPEST'
        assert b_data.get('detected_role') == 'BUYER'
        assert t_data.get('detected_role') == 'TRANSPORTER'
        print("\n>>> ALL LIVE MULTI-AGENT E2E RUNTIME ASSERTIONS PASSED! <<<")

if __name__ == "__main__":
    asyncio.run(main())
