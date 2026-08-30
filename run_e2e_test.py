import subprocess
import sys
import time
import httpx
import asyncio

# Start Node server
node_proc = subprocess.Popen('npm run server:dev', cwd='C:\\SIH-MicroLogistics', shell=True)
print(f'Node PID: {node_proc.pid}')

# Start Python ELA
python_proc = subprocess.Popen([sys.executable, '-m', 'ai.ela.main'], cwd='C:\\SIH-MicroLogistics')
print(f'Python PID: {python_proc.pid}')

time.sleep(10)

async def check_health():
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get('http://localhost:8000/v1/ela/health')
            print('Python ELA:', r.json())
        except Exception as e:
            print('Python ELA FAIL:', e)
        try:
            r2 = await client.get('http://localhost:5000/api/ela/health')
            print('Node ELA:', r2.json())
        except Exception as e:
            print('Node ELA FAIL:', e)

asyncio.run(check_health())

async def run_test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        payload = {
            'message': 'Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.',
            'context': {},
            'user': {'id': 'farmer-usr-101', 'name': 'Test Farmer', 'role': 'FARMER'},
            'session_id': 'session-e2e-test-1'
        }
        r = await client.post('http://localhost:8000/v1/ela/chat', json=payload)
        resp = r.json()
        print('\n=== PYTHON ELA RESPONSE ===')
        print('Language:', resp.get('language'))
        print('Role:', resp.get('detected_role'))
        print('Intent:', resp.get('intent'))
        print('Status:', resp.get('status'))
        print('Message:', resp.get('message'))
        
        conf = resp.get('confirmation_action')
        if conf:
            print('\nConfirmation:', conf.get('toolName'))
            print('Params:', conf.get('params'))
        
        ml = resp.get('ml_prediction')
        if ml:
            print('\nML Prediction:', ml.get('decision', {}).get('decision_type'))
            print('Confidence:', ml.get('confidence'))
            print('Explanation:', ml.get('explanation'))
        
        trace = resp.get('trace')
        if trace:
            print('\nTrace:', trace.get('trace_id'))
            print('Tools:', trace.get('selected_tools'))
            print('Model:', trace.get('model_provider'))
            print('Latency:', trace.get('total_latency_ms'), 'ms')
        
        return conf

conf = asyncio.run(run_test())

async def test_node():
    async with httpx.AsyncClient(timeout=30.0) as client:
        node_payload = {
            'message': 'Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.',
            'context': {},
            'sessionId': 'session-e2e-test-node-1',
            'user': {'id': 'farmer-usr-101', 'name': 'Test Farmer', 'role': 'FARMER'}
        }
        r = await client.post('http://localhost:5000/api/ela/chat', json=node_payload)
        print('\n=== NODE GATEWAY RESPONSE ===')
        print('Status:', r.status_code)
        print(r.json())

asyncio.run(test_node())

async def test_tool():
    if conf:
        async with httpx.AsyncClient(timeout=30.0) as client:
            tool_payload = {
                'toolName': 'request_transport',
                'params': conf.get('params') if conf else {},
                'userId': 'farmer-usr-101',
                'role': 'FARMER'
            }
            r = await client.post('http://localhost:5000/api/ela/internal/tool', json=tool_payload)
            print('\n=== INTERNAL TOOL EXECUTION ===')
            print('Status:', r.status_code)
            print(r.json())

asyncio.run(test_tool())

# Keep alive
time.sleep(5)
node_proc.terminate()
python_proc.terminate()