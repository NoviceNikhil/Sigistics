import asyncio
from config.db import init_db
from models.rule import ShipmentRule, RuleEvaluationLog

async def seed_rules():
    print("Initializing database connection...")
    await init_db()

    # Clear existing rules and logs to avoid duplicates and schema conflict
    print("🧹 Cleaning up old rules and logs...")
    await ShipmentRule.get_motor_collection().drop()
    await RuleEvaluationLog.get_motor_collection().drop()

    rules = [
        {
            "name": "Oversized Cargo Audit",
            "description": "Flags shipments exceeding 50 kg as oversized and marks them delayed for special handling.",
            "condition_tree": {
                "type": "condition",
                "target_field": "weight_kg",
                "operator": "gt",
                "threshold": 50.0
            },
            "tag_to_add": "OVERSIZED_CARGO",
            "delay_reason_to_set": "Package exceeds standard carrier weight limit (50 kg). Requires special handling equipment.",
            "set_is_delayed": True,
            "is_active": True
        },
        {
            "name": "Long Distance ETA Monitor",
            "description": "Flags long-haul shipments where estimated transit exceeds 40 hours and marks them delayed.",
            "condition_tree": {
                "type": "condition",
                "target_field": "eta_hours",
                "operator": "gt",
                "threshold": 40.0
            },
            "tag_to_add": "LONG_HAUL_AUDIT",
            "delay_reason_to_set": "Extended transit distance detected. ETA exceeds 40 hours — subject to inter-city relay delays.",
            "set_is_delayed": True,
            "is_active": True
        },
        {
            "name": "Live Transit Tracking",
            "description": "Attaches an active tracking tag to all shipments currently in transit for real-time monitoring.",
            "condition_tree": {
                "type": "condition",
                "target_field": "status",
                "operator": "eq",
                "threshold": "in_transit"
            },
            "tag_to_add": "ACTIVE_TRACKING",
            "is_active": True
        },
        {
            "name": "Agent Workload Alert",
            "description": "Tags shipments assigned to overloaded agents (more than 5 active shipments) for supervisor review.",
            "condition_tree": {
                "type": "condition",
                "target_field": "agent.active_shipments_count",
                "operator": "gt",
                "threshold": 5
            },
            "tag_to_add": "AGENT_OVERLOAD_RISK",
            "is_active": True
        },
        {
            "name": "Complex Test Rule: Urgent + Heavy",
            "description": "Testing the new AND logical grouping structure.",
            "condition_tree": {
                "type": "group",
                "logical_operator": "AND",
                "conditions": [
                    {
                        "type": "condition",
                        "target_field": "weight_kg",
                        "operator": "gt",
                        "threshold": 10.0
                    },
                    {
                        "type": "group",
                        "logical_operator": "OR",
                        "conditions": [
                            {
                                "type": "condition",
                                "target_field": "status",
                                "operator": "eq",
                                "threshold": "created"
                            },
                            {
                                "type": "condition",
                                "target_field": "pickup_city",
                                "operator": "eq",
                                "threshold": "New York"
                            }
                        ]
                    }
                ]
            },
            "tag_to_add": "HEAVY_AND_URGENT",
            "is_active": True
        }
    ]

    print(f"🌱 Seeding {len(rules)} rules into MongoDB...")
    
    for rule_data in rules:
        rule = ShipmentRule(**rule_data)
        await rule.insert()
        print(f"  Added Rule: {rule.name}")

    print("\n✨ Seeding complete! Your Logic Engine is now fully armed.")

if __name__ == "__main__":
    asyncio.run(seed_rules())