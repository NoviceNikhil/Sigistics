import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        payload = {
            "id": "SHIP-1234",
            "weight_kg": 60,
            "pickup_city": "New York",
            "status": "created"
        }
        resp = await client.post("http://127.0.0.1:8000/api/rules/evaluate", json=payload)
        print("Status", resp.status_code)
        print("Data", resp.json())

asyncio.run(main())
