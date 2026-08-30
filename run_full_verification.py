import asyncio
import httpx
import json
import os
import sys

# Force UTF-8 on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

async def run_full_pipeline_test():
    print("=" * 70)
    print("STARTING END-TO-END PIPELINE VERIFICATION")
    print("=" * 70)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Health checks for all services
        print("\n--- [1] HEALTH CHECKS ---")
        java_h = await client.get("http://localhost:8080/api/internal/ela/health")
        print(f"Java Authority (8080): {java_h.status_code} -> {java_h.json()}")
        
        py_h = await client.get("http://localhost:8000/v1/ela/health")
        print(f"Python ELA (8000): {py_h.status_code} -> status={py_h.json().get('status')}")
        
        node_h = await client.get("http://localhost:5000/api/health")
        print(f"Node Gateway (5000): {node_h.status_code} -> status={node_h.json().get('data', {}).get('status')}")

        # Step 2: Authenticate real test farmer in Node Gateway
        print("\n--- [2] AUTHENTICATION VIA NODE GATEWAY ---")
        login_res = await client.post("http://localhost:5000/api/auth/login", json={
            "email": "farmer@ruralflow.in",
            "password": "password123"
        })
        print(f"Login HTTP Status: {login_res.status_code}")
        login_data = login_res.json()
        assert login_res.status_code == 200, f"Login failed: {login_data}"
        
        user_info = login_data.get("data", {}).get("user", {})
        token = login_data.get("data", {}).get("token")
        user_id = user_info.get("id")
        user_role = user_info.get("role")
        user_name = user_info.get("name")
        print(f"Authenticated User: {user_name} (ID: {user_id}, Role: {user_role})")

        # Step 3: Python ELA NLU & Decision Engine Execution
        print("\n--- [3] PYTHON ELA NLU, REASONING & DECISION ENGINE ---")
        user_message = "Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye."
        print(f"User Input: \"{user_message}\"")
        
        ela_payload = {
            "message": user_message,
            "context": {"language": "hi", "sessionId": "session-e2e-live-1"},
            "user": {"id": user_id, "name": user_name, "role": user_role},
            "session_id": "session-e2e-live-1"
        }
        
        py_res = await client.post("http://localhost:8000/v1/ela/chat", json=ela_payload)
        print(f"Python ELA HTTP Status: {py_res.status_code}")
        py_data = py_res.json()
        
        print(f"Detected Language : {py_data.get('language')}")
        print(f"Detected Role     : {py_data.get('detected_role')}")
        print(f"Intent            : {py_data.get('intent')}")
        print(f"Status            : {py_data.get('status')}")
        print(f"Message           : {py_data.get('message')}")
        
        conf_action = py_data.get("confirmation_action")
        ml_pred = py_data.get("ml_prediction")
        trace = py_data.get("trace")
        
        if ml_pred:
            print(f"ML Decision Type  : {ml_pred.get('decision', {}).get('decision_type')}")
            print(f"ML Confidence     : {ml_pred.get('confidence')}")
            print(f"ML Explanation    : {ml_pred.get('explanation')}")
            
        if conf_action:
            print(f"Staged Tool Action: {conf_action.get('toolName')}")
            print(f"Action Summary    : {conf_action.get('summary')}")
            print(f"Action Parameters : {json.dumps(conf_action.get('params'), indent=2)}")

        # Step 4: Full flow via Node Gateway (Node -> Python ELA)
        print("\n--- [4] NODE GATEWAY CHAT INVOCATION (Node -> Python ELA) ---")
        node_chat_payload = {
            "message": user_message,
            "context": {"sessionId": "session-node-chat-1"},
            "sessionId": "session-node-chat-1"
        }
        node_chat_res = await client.post(
            "http://localhost:5000/api/ela/chat",
            json=node_chat_payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Node Gateway Chat Status: {node_chat_res.status_code}")
        node_chat_data = node_chat_res.json()
        print(f"Node Gateway Message: {node_chat_data.get('data', {}).get('message')}")

        # Step 5: Java Authority Direct Mutation Execution
        print("\n--- [5] JAVA AUTHORITY MUTATION EXECUTION (Farmer Logistics Request) ---")
        staged_params = conf_action.get("params") if conf_action else {
            "productName": "Tomatoes",
            "quantity": "500 kg",
            "pickupLocation": "Nashik",
            "destination": "Pune APMC Mandi",
            "estimatedEarnings": "6073"
        }
        
        java_tool_payload = {
            "toolName": "create_logistics_request",
            "params": {
                "productName": staged_params.get("productName", "Tomatoes"),
                "quantity": str(staged_params.get("quantity", "500 kg")),
                "pickupLocation": staged_params.get("pickupLocation", "Nashik"),
                "destination": staged_params.get("destination", "Pune APMC Mandi"),
                "estimatedEarnings": str(staged_params.get("estimatedFreight", "6073.32"))
            },
            "userId": user_id,
            "role": user_role,
            "confirmed": True
        }
        
        java_res = await client.post(
            "http://localhost:8080/api/internal/ela/tool",
            json=java_tool_payload,
            headers={
                "X-Internal-API-Key": "ela-internal-dev-key-2026",
                "Content-Type": "application/json"
            }
        )
        print(f"Java Authority HTTP Status: {java_res.status_code}")
        java_data = java_res.json()
        print(f"Java Authority Response: {json.dumps(java_data, indent=2)}")
        assert java_data.get("success") is True, f"Java mutation failed: {java_data}"
        created_logistics_id = java_data.get("data", {}).get("id")
        print(f"Created Logistics Request ID: {created_logistics_id}")

        # Step 6: Test Buyer Mutation (create_procurement)
        print("\n--- [6] JAVA AUTHORITY MUTATION EXECUTION (Buyer Procurement Request) ---")
        buyer_user_id = "4438384d-1ab1-41bc-a9d7-a6c145ba82f6" # Rajesh Singhania
        java_buyer_payload = {
            "toolName": "create_procurement",
            "params": {
                "cropName": "Organic Tomatoes (Grade A)",
                "quantityRequired": "1000 kg",
                "maxPricePerKg": "₹42/kg",
                "deliveryLocation": "Pune APMC Mandi"
            },
            "userId": buyer_user_id,
            "role": "BUYER",
            "confirmed": True
        }
        java_buyer_res = await client.post(
            "http://localhost:8080/api/internal/ela/tool",
            json=java_buyer_payload,
            headers={
                "X-Internal-API-Key": "ela-internal-dev-key-2026",
                "Content-Type": "application/json"
            }
        )
        print(f"Java Buyer Mutation HTTP Status: {java_buyer_res.status_code}")
        java_buyer_data = java_buyer_res.json()
        print(f"Java Buyer Response: {json.dumps(java_buyer_data, indent=2)}")
        assert java_buyer_data.get("success") is True
        created_procurement_id = java_buyer_data.get("data", {}).get("id")

        # Step 7: Test Transporter Mutation (create_vehicle)
        print("\n--- [7] JAVA AUTHORITY MUTATION EXECUTION (Transporter Vehicle Registration) ---")
        transporter_user_id = "066a427c-6269-42c1-97c0-d14364dfd273" # Sunil Deshmukh
        reg_num = f"MH 12 XY 9988"
        java_trans_payload = {
            "toolName": "create_vehicle",
            "params": {
                "fullName": "Sunil Deshmukh",
                "vehicleType": "Pickup (1.5 - 2.5 MT)",
                "vehicleRegNo": reg_num,
                "capacity": "2.0 MT",
                "operatingRegion": "Pune - Nashik Corridor",
                "phone": "+91 9876543210"
            },
            "userId": transporter_user_id,
            "role": "TRANSPORTER",
            "confirmed": True
        }
        java_trans_res = await client.post(
            "http://localhost:8080/api/internal/ela/tool",
            json=java_trans_payload,
            headers={
                "X-Internal-API-Key": "ela-internal-dev-key-2026",
                "Content-Type": "application/json"
            }
        )
        print(f"Java Transporter Mutation HTTP Status: {java_trans_res.status_code}")
        java_trans_data = java_trans_res.json()
        print(f"Java Transporter Response: {json.dumps(java_trans_data, indent=2)}")
        assert java_trans_data.get("success") is True
        created_vehicle_id = java_trans_data.get("data", {}).get("id")

        return {
            "logistics_id": created_logistics_id,
            "procurement_id": created_procurement_id,
            "vehicle_id": created_vehicle_id
        }

if __name__ == "__main__":
    result = asyncio.run(run_full_pipeline_test())
    with open("C:\\Users\\pmish\\.gemini\\antigravity-ide\\brain\\bdfee9fd-e2a1-4136-a7ae-282ff687cffd\\scratch\\pipeline_result.json", "w") as f:
        json.dump(result, f, indent=2)
    print("\nPIPELINE EXECUTION COMPLETE. IDs SAVED.")
