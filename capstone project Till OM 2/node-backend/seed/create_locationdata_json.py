import json

# Real-world coordinates (Latitude, Longitude) for your specific mapping
ACCURATE_MAPPING = {
    "Bengaluru": {
        "Indiranagar": (12.9719, 77.6412), "Whitefield": (12.9698, 77.7500), "Koramangala": (12.9352, 77.6245),
        "HSR Layout": (12.9121, 77.6446), "Electronic City": (12.8452, 77.6602), "Jayanagar": (12.9307, 77.5838)
    },
    "Mumbai": {
        "Andheri": (19.1136, 72.8697), "Bandra": (19.0596, 72.8295), "Powai": (19.1176, 72.9060),
        "Colaba": (18.9067, 72.8147), "Borivali": (19.2307, 72.8567), "Worli": (19.0176, 72.8177)
    },
    "Delhi": {
        "Dwarka": (28.5823, 77.0500), "Saket": (28.5245, 77.2100), "Connaught Place": (28.6315, 77.2167),
        "Hauz Khas": (28.5494, 77.2044), "Rohini": (28.7041, 77.1025), "Karol Bagh": (28.6515, 77.1917)
    },
    "Hyderabad": {
        "Gachibowli": (17.4401, 78.3489), "Jubilee Hills": (17.4326, 78.4071), "Banjara Hills": (17.4175, 78.4328),
        "Kukatpally": (17.4948, 78.3996), "Madhapur": (17.4483, 78.3915)
    },
    "Pune": {
        "Kothrud": (18.5074, 73.8077), "Hinjewadi": (18.5913, 73.7389), "Viman Nagar": (18.5679, 73.9143),
        "Baner": (18.5590, 73.7797), "Kalyani Nagar": (18.5463, 73.9033)
    },
    "Chennai": {
        "Adyar": (13.0012, 80.2565), "T. Nagar": (13.0418, 80.2341), "Velachery": (12.9797, 80.2200),
        "Anna Nagar": (13.0850, 80.2101), "Mylapore": (13.0368, 80.2676), "Guindy": (13.0067, 80.2206)
    },
    "Lucknow": {
        "Gomti Nagar": (26.8529, 81.0025), "Alambagh": (26.8041, 80.8986), "Hazratganj": (26.8493, 80.9419), "Indira Nagar": (26.8845, 80.9926)
    },
    "Ahmedabad": {
        "Satellite": (23.0298, 72.5126), "Navrangpura": (23.0365, 72.5611), "Prahlad Nagar": (23.0084, 72.5029), "Bodakdev": (23.0365, 72.5117)
    },
    "Kolkata": {
        "Salt Lake": (22.5804, 88.4143), "New Town": (22.5830, 88.4614), "Park Street": (22.5517, 88.3516), "Ballygunge": (22.5278, 88.3653), "Behala": (22.4930, 88.3188)
    }
}
    # Add other cities (Kolkata, Chennai, Ahmedabad, Lucknow) similarly


def generate_accurate_seeds():
    location_entries = []
    for city, subregions in ACCURATE_MAPPING.items():
        for sub, coords in subregions.items():
            location_entries.append({
                "city": city,
                "subregion": sub,
                "latitude": coords[0],
                "longitude": coords[1]
            })
    return location_entries

if __name__ == "__main__":
    locations = generate_accurate_seeds()
    with open("locations_seed.json", "w") as f:
        json.dump(locations, f, indent=2)
    print(f"  Generated {len(locations)} accurate location seeds.")