import httpx
import asyncio
import json

async def test_internal_tool():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Login as demo farmer
        print("=== Step 1: Login as demo farmer ===")
        login_resp = await client.post('http://localhost:5000/api/auth/login', json={
            'email': 'farmer@ruralflow.in',
            'password': 'password123'
        })
        print(f'Login Status: {login_resp.status_code}')
        login_data = login_resp.json()
        print(f'Login Response: {json.dumps(login_data, indent=2)}')
        
        if login_resp.status_code != 200:
            print("Login failed!")
            return
            
        token = login_data.get('data', {}).get('token')
        user_id = login_data.get('data', {}).get('user', {}).get('id')
        print(f'User ID: {user_id}')
        print(f'Token: {token[:50]}...')
        
        # Step 2: Test internal tool execution with real user
        print("\n=== Step 2: Test internal tool execution ===")
        tool_payload = {
            'toolName': 'create_logistics_request',
            'params': {
                'pickupLocation': 'Nashik',
                'destination': 'Pune APMC Mandi',
                'productName': 'Tomatoes',
                'quantity': 500.0,
                'vehicleType': 'Mini Truck (750 kg)',
                'estimatedFreight': 6073.32,
                'estimatedDuration': '5h 48m'
            },
            'userId': user_id,
            'role': 'FARMER'
        }
        
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        
        try:
            tool_resp = await client.post(
                'http://localhost:5000/api/ela/internal/tool', 
                json=tool_payload,
                headers=headers
            )
            print(f'Tool Status: {tool_resp.status_code}')
            print(f'Tool Response: {json.dumps(tool_resp.json(), indent=2)}')
        except Exception as e:
            print(f'Tool Exception: {type(e).__name__}: {e}')
        
        # Step 3: Verify database state
        print("\n=== Step 3: Check session state ===")
        session_resp = await client.get('http://localhost:5000/api/ela/session/session-test-1')
        print(f'Session Status: {session_resp.status_code}')
        print(f'Session Response: {json.dumps(session_resp.json(), indent=2)}')

asyncio.run(test_internal_tool())