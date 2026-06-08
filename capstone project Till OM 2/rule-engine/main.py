from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from beanie import PydanticObjectId
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, timezone

from models.rule import ShipmentRule
from services.processor import evaluate_shipment
from config.db import init_db
from models.rule import ShipmentRule, RuleEvaluationLog, RuleUpdateSchema

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Logistics Rule Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CORE LOGIC ENDPOINT ---

@app.post("/api/rules/evaluate")
async def process_shipment_rules(shipment: dict):
    # Fetch only active rules
    active_rules = await ShipmentRule.find(ShipmentRule.is_active == True).to_list()
    
    # Run the engine
    evaluation_result = await evaluate_shipment(shipment, active_rules)
    
    return {"status": "success", "data": evaluation_result}

@app.post("/api/rules/evaluate/batch")
async def process_batch_shipment_rules(payload: dict):
    shipments = payload.get("shipments", [])
    active_rules = await ShipmentRule.find(ShipmentRule.is_active == True).to_list()
    
    results = []
    for shipment in shipments:
        # Run the engine for each (sequential inside this task is fine for baseline performance)
        res = await evaluate_shipment(shipment, active_rules)
        # Add the shipment ID to help Node.js map results back
        res["id"] = shipment.get("id")
        res["shipment_code"] = shipment.get("shipment_code")
        results.append(res)
    
    return {"status": "success", "data": results}

@app.get("/api/rules/logs")
async def get_all_evaluation_logs(limit: int = 1000, search: Optional[str] = None, only_flagged: bool = False):
    # Support native Debounced Backend filtering
    query = {}
    
    # If only_flagged is True, we only return logs where a rule actually fired AND had an effect
    if only_flagged:
        query["result"] = True
        query["$or"] = [
            {"tags_applied": {"$exists": True, "$ne": []}},
            {"is_delayed_applied": True},
            {"delay_reason_applied": {"$ne": None}}
        ]

    if search:
        # Create a flexible regex that treats spaces and underscores interchangeably
        # This allows searching "heavy and urgent" to match "heavy_and_urgent"
        fuzzy_search = search.strip().replace(" ", "[_ ]")
        search_query = {
            "$or": [
                {"shipment_id": {"$regex": search, "$options": "i"}},
                {"rule_name": {"$regex": search, "$options": "i"}},
                {"tags_applied": {"$regex": fuzzy_search, "$options": "i"}}
            ]
        }
        if query:
            query = {"$and": [query, search_query]}
        else:
            query = search_query

    logs = await RuleEvaluationLog.find(query).sort("-evaluated_at").limit(limit).to_list()
    return {"status": "success", "data": logs}

@app.get("/api/rules/logs/shipment/{shipment_id}")
async def get_logs_by_shipment(shipment_id: str):
    # Allows the admin dashboard to trace a specific shipment's history
    logs = await RuleEvaluationLog.find(
        RuleEvaluationLog.shipment_id == shipment_id
    ).sort("-evaluated_at").to_list()
    
    return {"status": "success", "data": logs}

# --- ADMIN CRUD ENDPOINTS ---

@app.post("/api/rules")
async def create_rule(rule: ShipmentRule):
    await rule.insert()
    return {"status": "success", "data": rule}

@app.get("/api/rules")
async def get_all_rules(active_only: bool = False, search: Optional[str] = None):
    query = {}
    if active_only:
        query["is_active"] = True
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"tag_to_add": {"$regex": search, "$options": "i"}},
            {"delay_reason_to_set": {"$regex": search, "$options": "i"}}
        ]
        
    rules = await ShipmentRule.find(query).to_list()
    return {"status": "success", "data": rules}

@app.get("/api/rules/{rule_id}")
async def get_rule_by_id(rule_id: PydanticObjectId):
    rule = await ShipmentRule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="RULE_NOT_FOUND")
    return {"status": "success", "data": rule}

@app.patch("/api/rules/{rule_id}")
async def update_rule(rule_id: PydanticObjectId, rule_update: RuleUpdateSchema):
    rule = await ShipmentRule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="RULE_NOT_FOUND")

    # Update only the provided fields
    update_data = rule_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)

    await rule.save()
    return {"status": "success", "data": rule}

@app.delete("/api/rules/{rule_id}")
async def delete_rule(rule_id: PydanticObjectId):
    rule = await ShipmentRule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="RULE_NOT_FOUND")

    # True Soft Delete aligning with your Node.js logic
    rule.is_active = False
    rule.deleted_at = datetime.now(timezone.utc)
    await rule.save()
    
    return {"status": "success", "data": None, "message": "Rule successfully disabled"}
