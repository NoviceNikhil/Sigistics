import json
from collections import defaultdict

def analyze():
    with open('seeded_data/shipments_seed.json') as f:
        shipments = json.load(f)
    
    with open('seeded_data/shipment_histories_seed.json') as f:
        histories = json.load(f)

    # Map histories
    history_map = defaultdict(list)
    for h in histories:
        history_map[h['shipment_id']].append(h)

    errors = 0
    zero_count = 0
    
    expected_flows = {
        'assigned': ['created->assigned'],
        'picked': ['created->assigned', 'assigned->picked'],
        'in_transit': ['created->assigned', 'assigned->picked', 'picked->in_transit'],
        'delivered': ['created->assigned', 'assigned->picked', 'picked->in_transit', 'in_transit->delivered'],
        'cancelled': ['created->assigned', 'assigned->cancelled']
    }

    for s in shipments:
        sid = s['id']
        s_histories = history_map.get(sid, [])
        
        if not s_histories:
            if s['status'] == 'created':
                zero_count += 1
            else:
                print(f"ERROR: Shipment {sid} is {s['status']} but has 0 histories.")
                errors += 1
        else:
            flow = [f"{h['previous_status']}->{h['new_status']}" for h in s_histories]
            expected = expected_flows.get(s['status'])
            
            if expected and expected != flow:
                print(f"ERROR: Shipment {sid} expected {expected} but got {flow}")
                errors += 1

    print(f"Analysis complete for {len(shipments)} shipments.")
    print(f"Shipments with 0 histories (validly 'created'): {zero_count}")
    print(f"Flow Errors found: {errors}")

if __name__ == '__main__':
    analyze()
