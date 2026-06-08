import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from typing import Optional, Any

class ShipmentRule(Document):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    condition_tree: dict
    tag_to_add: Optional[str] = None
    delay_reason_to_set: Optional[str] = None
    set_is_delayed: bool = False

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.logistics_rules, document_models=[ShipmentRule])
    rule = await ShipmentRule.find_one({"name": "modi"})
    if rule:
        print(f"Rule found: {rule.name}")
        print(f"Tag to add: {rule.tag_to_add}")
        print(f"Delay reason: {rule.delay_reason_to_set}")
        print(f"Set is delayed: {rule.set_is_delayed}")
    else:
        print("Rule not found")

if __name__ == "__main__":
    asyncio.run(main())
