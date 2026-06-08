import operator
from models.rule import RuleEvaluationLog, ConditionNode

operators_map = {
    "gt": operator.gt,
    "lt": operator.lt,
    "eq": operator.eq,
    "not_eq": operator.ne,
    ">": operator.gt,
    "<": operator.lt,
    "==": operator.eq,
    "!=": operator.ne
}

def get_nested_value(data_dict: dict, field_path: str):
    keys = field_path.split('.')
    val = data_dict
    for key in keys:
        if isinstance(val, dict):
            val = val.get(key)
        else:
            return None
    return val

def evaluate_node(node: ConditionNode, data: dict) -> bool:
    if node.type == "group":
        if not node.conditions:
            return True
        if node.logical_operator == "AND":
            return all(evaluate_node(child, data) for child in node.conditions)
        elif node.logical_operator == "OR":
            return any(evaluate_node(child, data) for child in node.conditions)
        return False
    elif node.type == "condition":
        field_value = get_nested_value(data, node.target_field)
        if field_value is None:
            return False
            
        op_func = operators_map.get(node.operator)
        if not op_func:
            return False
            
        try:
            val = float(field_value)
            thresh = float(node.threshold)
            return op_func(val, thresh)
        except (ValueError, TypeError):
            # Case-insensitive comparison for strings
            return op_func(str(field_value).strip().lower(), str(node.threshold).strip().lower())

    return False

async def evaluate_shipment(shipment_payload: dict, active_rules: list):
    current_tags = set(shipment_payload.get("tags") or [])
    current_delay_reason = shipment_payload.get("delay_reason")
    current_is_delayed = shipment_payload.get("is_delayed", False)
    # Fallback to shipment_code if database id is not present (standard for bulk uploads)
    shipment_id = str(shipment_payload.get("id") or shipment_payload.get("shipment_code") or "unknown")
    
    for rule in active_rules:
        # Recursively evaluate the condition tree
        rule_triggered = evaluate_node(rule.condition_tree, shipment_payload)

        tags_applied = []
        reason_applied = None
        is_delayed_applied = None

        if rule_triggered:
            # Output 1: Tags
            if rule.tag_to_add:
                current_tags.add(rule.tag_to_add)
                tags_applied.append(rule.tag_to_add)
            
            # Output 2: Delay Reason (Auto-triggers is_delayed)
            if rule.delay_reason_to_set:
                current_delay_reason = rule.delay_reason_to_set
                reason_applied = rule.delay_reason_to_set
                current_is_delayed = True
                is_delayed_applied = True
                
            # Output 3: Manual is_delayed flip
            if rule.set_is_delayed is True:
                current_is_delayed = True
                is_delayed_applied = True

        # Insert Audit Log
        log = RuleEvaluationLog(
            shipment_id=shipment_id,
            rule_id=rule.id,
            rule_name=rule.name,
            input_snapshot=shipment_payload,
            result=rule_triggered,
            tags_applied=tags_applied,
            delay_reason_applied=reason_applied,
            is_delayed_applied=is_delayed_applied
        )
        await log.insert()

    # The exact payload Node.js needs to update the MySQL row
    return {
        "tags": list(current_tags),
        "delay_reason": current_delay_reason,
        "is_delayed": current_is_delayed
    }