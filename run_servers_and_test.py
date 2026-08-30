import threading
import time
import sys
import os
import subprocess
import httpx
import asyncio

# Add current directory to path
sys.path.insert(0, 'C:\\SIH-MicroLogistics')

# Global processes
node_proc = None
python_proc = None

def start_node_server():
    """Start Node server in background"""
    global node_proc
    node_proc = subprocess.Popen(
        'npm run server:dev', 
        cwd='C:\\SIH-MicroLogistics', 
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    print(f'Node server started with PID: {node_proc.pid}')

def start_python_ela():
    """Start Python ELA server using uvicorn directly"""
    import uvicorn
    from ai.ela.main import app
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

async def wait_for_servers():
    """Wait for both servers to be ready"""
    for i in range(30):
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                r1 = await client.get('http://localhost:8000/v1/ela/health')
                r2 = await client.get('http://localhost:5000/api/ela/health')
                if r1.status_code == 200 and r2.status_code == 200:
                    print('Both servers are ready!')
                    print('Python ELA:', r1.json())
                    print('Node ELA:', r2.json())
                    return True
        except Exception as e:
            pass
        await asyncio.sleep(1)
    print('Servers did not start in time')
    return False

async def run_e2e_test():
    """Run the full E2E test"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        print('\n' + '=' * 60)
        print('E2E TEST: Hindi/Hinglish Farmer Transport Request')
        print('=' * 60)
        
        # Step 1: Send to Python ELA directly
        print('\n[1] Sending message to Python ELA...')
        payload = {
            'message': 'Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.',
            'context': {},
            'user': {'id': 'farmer-usr-101', 'name': 'Test Farmer', 'role': 'FARMER'},
            'session_id': 'session-e2e-test-1'
        }
        
        r = await client.post('http://localhost:8000/v1/ela/chat', json=payload)
        resp = r.json()
        print(f'Status: {r.status_code}')
        print(f'Language: {resp.get("language")}')
        print(f'Role: {resp.get("detected_role")}')
        print(f'Intent: {resp.get("intent")}')
        print(f'Status: {resp.get("status")}')
        msg = resp.get("message")
        if msg:
            print(f'Message: {msg.encode("ascii", "replace").decode("ascii")}')
        else:
            print('Message: None')
        
        conf = resp.get('confirmation_action')
        if conf:
            print(f'\n[2] CONFIRMATION REQUIRED:')
            print(f'  Tool: {conf.get("toolName")}')
            print(f'  Params: {conf.get("params")}')
        
        ml = resp.get('ml_prediction')
        if ml:
            print(f'\n[3] ML PREDICTION:')
            print(f'  Decision: {ml.get("decision", {}).get("decision_type")}')
            print(f'  Confidence: {ml.get("confidence")}')
            expl = ml.get("explanation")
            if expl:
                print(f'  Explanation: {expl.encode("ascii", "replace").decode("ascii")}')
        
        trace = resp.get('trace')
        if trace:
            print(f'\n[4] EXECUTION TRACE:')
            print(f'  Trace ID: {trace.get("trace_id")}')
            print(f'  Tools: {trace.get("selected_tools")}')
            print(f'  Model: {trace.get("model_provider")}')
            print(f'  Latency: {trace.get("total_latency_ms")}ms')
        
        # Step 5: Via Node Gateway
        print('\n[5] Testing via Node Gateway...')
        node_payload = {
            'message': 'Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.',
            'context': {},
            'sessionId': 'session-e2e-test-node-1',
            'user': {'id': 'farmer-usr-101', 'name': 'Test Farmer', 'role': 'FARMER'}
        }
        r2 = await client.post('http://localhost:5000/api/ela/chat', json=node_payload)
        node_resp = r2.json()
        print(f'Node Status: {r2.status_code}')
        node_str = str(node_resp).encode("ascii", "replace").decode("ascii")
        print(f'Node Response: {node_str[:2000]}')
        
        # Step 6: Internal tool execution (Node -> Java)
        if conf:
            print('\n[6] Testing Internal Tool Execution (Node -> Java)...')
            tool_name = conf.get('toolName')
            tool_payload = {
                'toolName': tool_name,
                'params': conf.get('params') if conf else {},
                'userId': 'farmer-usr-101',
                'role': 'FARMER'
            }
            r3 = await client.post('http://localhost:5000/api/ela/internal/tool', json=tool_payload)
            tool_resp = r3.json()
            print(f'Tool Status: {r3.status_code}')
            tool_str = str(tool_resp).encode("ascii", "replace").decode("ascii")
            print(f'Tool Response: {tool_str[:3000]}')
        
        # Step 7: Verify database via session
        print('\n[7] Checking Session State...')
        r4 = await client.get('http://localhost:5000/api/ela/session/session-e2e-test-node-1')
        session_resp = r4.json()
        print(f'Session Status: {r4.status_code}')
        session_str = str(session_resp).encode("ascii", "replace").decode("ascii")
        print(f'Session: {session_str[:2000]}')
        
        return conf

async def main():
    # Start Node server in background thread
    print('Starting Node server...')
    node_thread = threading.Thread(target=start_node_server, daemon=True)
    node_thread.start()
    
    # Start Python ELA in background thread
    print('Starting Python ELA...')
    python_thread = threading.Thread(target=start_python_ela, daemon=True)
    python_thread.start()
    
    # Wait for servers
    ready = await wait_for_servers()
    if not ready:
        print('ERROR: Servers not ready')
        return
    
    # Run E2E test
    await run_e2e_test()
    
    print('\nTest complete!')

if __name__ == '__main__':
    asyncio.run(main())