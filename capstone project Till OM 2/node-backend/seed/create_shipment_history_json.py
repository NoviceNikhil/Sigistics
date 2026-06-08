import json
import random
import uuid
from datetime import datetime, timedelta

# Configuration
INPUT_FILE = "shipments_seed.json"
OUTPUT_FILE = "shipment_histories_seed.json"
random.seed(11)

# Transition chains
STATUS_FLOW = ["created", "assigned", "picked", "in_transit", "delivered"]
CANCELLED_FLOW = ["created", "assigned", "cancelled"] # Simplification

def generate_history():
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            shipments = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: {INPUT_FILE} not found. Run create_shipment_json.py first.")
        return

    histories = []
    DELAY_REASONS = ["Heavy Monsoon", "Traffic Congestion", "Vehicle Breakdown", "Road Closure"]

    for shipment in shipments:
        sid = shipment['id']
        current_status = shipment['status']
        created_at_dt = datetime.fromisoformat(shipment['createdAt'] if 'createdAt' in shipment else "2026-04-01T00:00:00")
        
        # Define the path this shipment took
        if current_status == "cancelled":
            # For cancelled, they might have been created, or assigned then cancelled
            path = ["created", "assigned", "cancelled"]
        elif current_status in STATUS_FLOW:
            idx = STATUS_FLOW.index(current_status)
            path = STATUS_FLOW[:idx+1]
        else:
            path = ["created"]

        current_time = created_at_dt
        
        for i in range(len(path) - 1):
            prev_status = path[i]
            next_status = path[i+1]
            
            # Realistic time gap: 15 mins to 8 hours
            minutes_gap = random.randint(15, 480)
            current_time += timedelta(minutes=minutes_gap)
            
            # If it's a delivered shipment, we should respect the actual_delivery_at if possible
            # but for seeding simplicity we just move forward chronologically.
            
            history_entry = {
                "shipment_id": sid,
                "previous_status": prev_status,
                "new_status": next_status,
                "notes": random.choice(DELAY_REASONS) if random.random() < 0.15 else f"Transitioned from {prev_status} to {next_status}",
                "createdAt": current_time.isoformat(),
                "updatedAt": current_time.isoformat()
            }
            histories.append(history_entry)

    # Export to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(histories, f, indent=2)

    print(f"  Generated {len(histories)} logical history transitions for {len(shipments)} shipments.")

if __name__ == "__main__":
    generate_history()