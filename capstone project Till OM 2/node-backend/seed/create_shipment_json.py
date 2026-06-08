import pandas as pd
import json
import random
import uuid 
from datetime import datetime, timedelta
from faker import Faker

# 1. Initialize Deterministic Seeding (Seed 11)
fake = Faker('en_IN')
Faker.seed(11)
random.seed(11)

# Configuration
INPUT_FILE = "../dataset/Delivery_Logistics.csv"
OUTPUT_FILE = "shipments_seed.json"
AGENT_COUNT = 1000 
USER_COUNT = 50     

# Recreate the exact 50 User UUIDs from your user script
USER_UUIDS = [str(uuid.uuid5(uuid.NAMESPACE_DNS, f"vendor_{i}")) for i in range(USER_COUNT)]

# Sub-region Mapping for Rule Engine granularity
CITY_SUBREGIONS = {
    "Bengaluru": ["Indiranagar", "Whitefield", "Koramangala", "HSR Layout", "Electronic City", "Jayanagar"],
    "Mumbai": ["Andheri", "Bandra", "Powai", "Colaba", "Borivali", "Worli"],
    "Delhi": ["Dwarka", "Saket", "Connaught Place", "Hauz Khas", "Rohini", "Karol Bagh"],
    "Hyderabad": ["Gachibowli", "Jubilee Hills", "Banjara Hills", "Kukatpally", "Madhapur"],
    "Chennai": ["Adyar", "T. Nagar", "Velachery", "Anna Nagar", "Mylapore", "Guindy"],
    "Pune": ["Kothrud", "Hinjewadi", "Viman Nagar", "Baner", "Kalyani Nagar"],
    "Lucknow": ["Gomti Nagar", "Alambagh", "Hazratganj", "Indira Nagar"],
    "Ahmedabad": ["Satellite", "Navrangpura", "Prahlad Nagar", "Bodakdev"],
    "Kolkata": ["Salt Lake", "New Town", "Park Street", "Ballygunge", "Behala"]
}

INDIAN_CITIES = list(CITY_SUBREGIONS.keys())
DELAY_REASONS = ["Heavy Monsoon", "Traffic Congestion", "Vehicle Breakdown", "Road Closure", "Public Holiday"]

def clean_to_float(val):
    try:
        return float(val)
    except ValueError:
        if isinstance(val, str) and ' ' in val:
            parts = val.split(':')
            if len(parts) >= 3:
                return float(parts[-1].split('.')[-1])
        return 5.0 

try:
    df = pd.read_csv(INPUT_FILE)
    shipments = []

    for index, row in df.iterrows():
        if index >= 2000:
            break

        raw_expected_hours = clean_to_float(row['expected_time_hours'])
        
        # Pick Cities
        pickup_city = random.choice(INDIAN_CITIES)
        delivery_city = random.choice([c for c in INDIAN_CITIES if c != pickup_city])
        
        # Pick Sub-regions based on chosen cities
        pickup_subregion = random.choice(CITY_SUBREGIONS[pickup_city])
        delivery_subregion = random.choice(CITY_SUBREGIONS[delivery_city])
        
        real_status = str(row['delivery_status']).lower()
        mapped_status = "delivered" if real_status == "delivered" else "in_transit"
        if real_status == "failed":
            mapped_status = "cancelled"
            
        # Force exact counts for specific statuses to de-skew the dataset
        if index < 50:
            mapped_status = "created"
        elif index < 100:
            mapped_status = "assigned"
        elif index < 150:
            mapped_status = "picked"

        # Current Location Logic
        current_city = None
        current_subregion = None
        
        if mapped_status == "created":
            current_city = None
            current_subregion = None
        elif mapped_status == "delivered":
            current_city = delivery_city
            current_subregion = delivery_subregion
        else:
            # Covers in_transit, cancelled, picked, assigned
            current_city = pickup_city
            current_subregion = pickup_subregion

        # Time Logic: Diversify across 90 days with "noise"
        # We use a base date (today) and subtract random days
        base_date = datetime.now()
        random_days = random.randint(0, 90)
        # Adding some "daily noise" to avoid perfectly flat distribution
        random_hours = random.randint(0, 23)
        random_minutes = random.randint(0, 59)
        
        created_at = base_date - timedelta(days=random_days, hours=random_hours, minutes=random_minutes)
        expected_at = created_at + timedelta(hours=raw_expected_hours)
        
        is_delayed = True if str(row['delayed']).lower() == 'yes' else False
        actual_at = None
        if mapped_status == "delivered":
            actual_at = expected_at + (timedelta(hours=random.randint(2, 6)) if is_delayed else -timedelta(hours=random.randint(1, 3)))

        shipment_tags = []
        if is_delayed:
            shipment_tags.append("delayed_delivery")
        
        simulated_workload = random.randint(1, 5)
        if simulated_workload > 3:
            shipment_tags.append("overloaded_agent")

        # Generate a deterministic UUID for this specific shipment
        shipment_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"shipment_{index}"))

        shipment_entry = {
            "id": shipment_uuid, 
            "shipment_code": f"SHP-{10000 + index}",
            "user_id": random.choice(USER_UUIDS), 
            # "agent_id": random.randint(1, AGENT_COUNT),
            "agent_id":None if mapped_status=="created" else random.randint(1,AGENT_COUNT),
            "pickup_city": pickup_city,
            "pickup_subregion": pickup_subregion,
            "delivery_city": delivery_city,
            "delivery_subregion": delivery_subregion,
            
            # Appended Current Location Fields
            "current_location_id": None,
            "current_city": current_city,
            "current_subregion": current_subregion,
            
            # Equal Transport Load: 33/33/33 distribute package types
            "package_type": ["small", "medium", "large"][index % 3],
            "weight_kg": round(float(row['package_weight_kg']), 2),
            "status": mapped_status,
            "estimated_distance_km": round(float(row['distance_km']), 2),
            "eta_hours": round(raw_expected_hours, 2),
            "expected_delivery_at": expected_at.isoformat(),
            "actual_delivery_at": actual_at.isoformat() if actual_at else None,
            "createdAt": created_at.isoformat(),
            "updatedAt": created_at.isoformat(),
            "is_delayed": is_delayed,
            "delay_reason": random.choice(DELAY_REASONS) if is_delayed else None,
            "tags": shipment_tags
        }
        shipments.append(shipment_entry)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(shipments, f, indent=2)

    print(f"Created {OUTPUT_FILE} with Sub-region mapping, UUID linking, and dynamic current locations.")

except Exception as e:
    print(f"Error during processing: {e}")