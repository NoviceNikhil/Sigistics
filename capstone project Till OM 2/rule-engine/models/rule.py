from beanie import Document, PydanticObjectId, before_event, Replace, SaveChanges
from pydantic import Field, BaseModel
from typing import Any, Optional, List, Union
from datetime import datetime, timezone

def get_now():
    return datetime.now(timezone.utc)

class ConditionNode(BaseModel):
    type: str # "condition" or "group"
    # Fields for 'condition'
    target_field: Optional[str] = None
    operator: Optional[str] = None
    threshold: Optional[Any] = None
    # Fields for 'group'
    logical_operator: Optional[str] = None # "AND", "OR"
    conditions: Optional[List['ConditionNode']] = None

ConditionNode.model_rebuild()

class ShipmentRule(Document):
    name: str
    description: Optional[str] = None
    
    # --- The nested condition logic root ---
    condition_tree: ConditionNode
    
    # --- STRICT BOUNDARY: ONLY ALLOWED OUTPUTS ---
    tag_to_add: Optional[str] = None
    delay_reason_to_set: Optional[str] = None
    set_is_delayed: Optional[bool] = None
    
    is_active: bool = True
    
    created_at: datetime = Field(default_factory=get_now)
    updated_at: datetime = Field(default_factory=get_now)
    deleted_at: Optional[datetime] = None

    class Settings:
        name = "shipment_rules"

    @before_event(Replace, SaveChanges)
    def update_timestamp(self):
        self.updated_at = get_now()

class RuleEvaluationLog(Document):
    shipment_id: str
    rule_id: PydanticObjectId
    rule_name: str
    evaluated_at: datetime = Field(default_factory=get_now)
    input_snapshot: dict
    result: bool
    
    # --- AUDIT TRAIL FOR STRICT BOUNDARY OUTPUTS ---
    tags_applied: List[str]
    delay_reason_applied: Optional[str] = None
    is_delayed_applied: Optional[bool] = None

    class Settings:
        name = "rule_evaluation_logs"

class RuleUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    condition_tree: Optional[ConditionNode] = None
    tag_to_add: Optional[str] = None
    delay_reason_to_set: Optional[str] = None
    set_is_delayed: Optional[bool] = None
    is_active: Optional[bool] = None