import asyncio
import httpx
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

async def test_node_full_lifecycle():
    print("=" * 70)
    print("TESTING NODE GATEWAY FULL LIFECYCLE (Chat -> Confirm -> Node ActionExecutor)")
    print("=" * 70)
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Login
        login_res = await client.post("http://localhost:5000/api/auth/login", json={
            "email": "farmer@ruralflow.in",
            "password": "password123"
        })
        token = login_res.json().get("data", {}).get("token")
        user_id = login_res.json().get("data", {}).get("user", {}).get("id")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Chat
        chat_res = await client.post(
            "http://localhost:5000/api/ela/chat",
            json={
                "message": "Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.",
                "context": {"sessionId": "session-lifecycle-1"}
            },
            headers=headers
        )
        chat_data = chat_res.json().get("data", {})
        conf_action = chat_data.get("confirmationAction")
        print(f"Chat Response Message: {chat_data.get('message')}")
        print(f"Confirmation Action: {conf_action.get('toolName') if conf_action else 'None'}")
        
        if conf_action:
            # Step 3: Confirm action through Node
            confirm_payload = {
                "actionId": "action-live-1",
                "toolName": conf_action.get("toolName"),
                "params": conf_action.get("params"),
                "confirmed": True,
                "language": "hi"
            }
            confirm_res = await client.post(
                "http://localhost:5000/api/ela/confirm",
                json=confirm_payload,
                headers=headers
            )
            print(f"Confirm Status: {confirm_res.status_code}")
            confirm_data = confirm_res.json()
            print(f"Confirm Response: {json.dumps(confirm_data, indent=2)}")

if __name__ == "__main__":
    asyncio.run(test_node_full_lifecycle())
