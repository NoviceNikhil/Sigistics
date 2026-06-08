import motor.motor_asyncio
from beanie import init_beanie

from models.rule import ShipmentRule, RuleEvaluationLog
from config.settings import settings

async def init_db():
    # Use the URI from your .env file
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    # Use the database name from your .env file
    await init_beanie(
        database=db,
        document_models=[
            ShipmentRule, 
            RuleEvaluationLog
        ]
    )