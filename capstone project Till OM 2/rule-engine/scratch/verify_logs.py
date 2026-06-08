import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document, PydanticObjectId
from typing import List, Optional
from datetime import datetime
from pydantic import Field

class RuleEvaluationLog(Document):
    shipment_id: str
    rule_id: PydanticObjectId
    rule_name: str
    result: bool
    tags_applied: List[str]
    is_delayed_applied: Optional[bool] = None
    delay_reason_applied: Optional[str] = None

    class Settings:
        name = "rule_evaluation_logs"

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.logistics_db, document_models=[RuleEvaluationLog])
    
    total = await RuleEvaluationLog.find_all().count()
    active = await RuleEvaluationLog.find(RuleEvaluationLog.result == True).count()
    
    print(f"Total Logs: {total}")
    print(f"Active Logs (Result=True): {active}")
    
    # Check for "unknown" IDs
    unknowns = await RuleEvaluationLog.find(RuleEvaluationLog.shipment_id == "unknown").count()
    print(f"Logs with 'unknown' shipment_id: {unknowns}")

if __name__ == "__main__":
    asyncio.run(check())
