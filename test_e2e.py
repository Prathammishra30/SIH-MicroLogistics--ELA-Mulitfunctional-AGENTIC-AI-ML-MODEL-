import httpx
import asyncio
import json

async def run_full_e2e_test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print('=' * 60)
        print('E2E TEST: Hindi/Hinglish Farmer Transport Request')
        print('=' * 60)
        
        # Step 1: Send chat message to Python ELA directly
        print('\n[1] Sending message to Python ELA...')
        payload = {
            'message': 'Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.',
            'context': {},
            'user': {'id': 'farmer-usr-101', 'name': 'Test Farmer', 'role': 'FARMER'},
            'session_id': 'session-e2e-test-1'
        }
        
        r = await client.post('http://localhost:8000/v1/ela/chat', json=payload)
        response = r.json()
        print(f'Status: {r.status_code}')
        print(f'Language: {response.get("language")}')
        print(f'Detected Role: {response.get("detected_role")}')
        print(f'Intent: {response.get("intent")}')
        print(f'Status: {response.get("status")}')
        print(f'Message: {response.get("message")}')
        
        # Check confirmation action
        conf = response.get('confirmation_action')
        if conf:
            print(f'\n[2] CONFIRMATION REQUIRED:')
            print(f'  Tool: {conf.get("toolName")}')
            params = conf.get('params', {})
            print(f'  Params: {json.dumps(params, indent=4)}')
        
        # Check ML prediction
        ml = response.get('ml_prediction')
        if ml:
            print(f'\n[3] ML PREDICTION:')
            print(f'  Decision: {ml.get("decision", {}).get("decision_type")}')
            print(f'  Confidence: {ml.get("confidence")}')
            print(f'  Explanation: {ml.get("explanation")}')
        
        # Check trace
        trace = response.get('trace')
        if trace:
            print(f'\n[4] EXECUTION TRACE:')
            print(f'  Trace ID: {trace.get("trace_id")}')
            print(f'  Selected Tools: {trace.get("selected_tools")}')
            print(f'  Model Provider: {trace.get("model_provider")}')
            print(f'  Total Latency: {trace.get("total_latency_ms")}ms')
        
        # Step 5: Test the full chain through Node gateway
        print('\n[5] Testing via Node Gateway...')
        node_payload = {
            'message': 'Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.',
            'context': {},
            'sessionId': 'session-e2e-test-node-1',
            'user': {'id': 'farmer-usr-101', 'name': 'Test Farmer', 'role': 'FARMER'}
        }
        r2 = await client.post('http://localhost:5000/api/ela/chat', json=node_payload)
        node_response = r2.json()
        print(f'Node Status: {r2.status_code}')
        print(f'Node Response: {json.dumps(node_response, indent=2)[:2000]}')
        
        # Step 6: Test confirmation through Node
        if conf:
            print('\n[6] Testing Confirmation via Node...')
            confirm_payload = {
                'actionId': 'test-action-1',
                'toolName': conf.get('toolName'),
                'params': conf.get('params'),
                'confirmed': True,
                'language': 'hi'
            }
            r3 = await client.post('http://localhost:5000/api/ela/confirm', json=confirm_payload)
            confirm_response = r3.json()
            print(f'Confirm Status: {r3.status_code}')
            print(f'Confirm Response: {json.dumps(confirm_response, indent=2)[:3000]}')
        
        # Step 7: Test internal tool execution (Node -> Java)
        print('\n[7] Testing Internal Tool Execution (Node -> Java)...')
        tool_payload = {
            'toolName': 'request_transport',
            'params': conf.get('params') if conf else {},
            'userId': 'farmer-usr-101',
            'role': 'FARMER'
        }
        r4 = await client.post('http://localhost:5000/api/ela/internal/tool', json=tool_payload)
        tool_response = r4.json()
        print(f'Tool Status: {r4.status_code}')
        print(f'Tool Response: {json.dumps(tool_response, indent=2)[:3000]}')
        
        # Step 8: Verify database state
        print('\n[8] Checking Session State...')
        r5 = await client.get('http://localhost:5000/api/ela/session/session-e2e-test-node-1')
        session_response = r5.json()
        print(f'Session Status: {r5.status_code}')
        print(f'Session: {json.dumps(session_response, indent=2)[:2000]}')

asyncio.run(run_full_e2e_test())