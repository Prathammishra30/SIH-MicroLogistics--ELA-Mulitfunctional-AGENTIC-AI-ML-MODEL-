# Inspect all live services, endpoints, and PostgreSQL seed users
import asyncio
import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("==================================================")
    print("INFRASTRUCTURE & HEALTH AUDIT (PHASE 9.1)")
    print("==================================================")

    async with httpx.AsyncClient(timeout=5.0) as client:
        # 1. Python ELA Service
        try:
            r = await client.get("http://127.0.0.1:8000/v1/ela/health")
            print(f"[1] Python ELA (Port 8000): {r.status_code}")
            print(f"    Payload: {json.dumps(r.json(), indent=2)}")
        except Exception as e:
            print(f"[1] Python ELA (Port 8000): FAILED ({e})")

        # 2. Java Spring Boot Authority Backend
        try:
            r = await client.get("http://localhost:8080/api/internal/ela/health")
            print(f"\n[2] Java Spring Boot (Port 8080): {r.status_code}")
            print(f"    Payload: {json.dumps(r.json(), indent=2)}")
        except Exception as e:
            print(f"\n[2] Java Spring Boot (Port 8080): FAILED ({e})")

        # 3. Node Gateway
        try:
            r = await client.get("http://localhost:5000/api/health")
            print(f"\n[3] Node Gateway (Port 5000): {r.status_code}")
            print(f"    Payload: {r.text[:200]}")
        except Exception as e:
            print(f"\n[3] Node Gateway (Port 5000): FAILED ({e})")

if __name__ == "__main__":
    asyncio.run(main())
