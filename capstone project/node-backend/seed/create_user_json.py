import json
import random
import string
import uuid
from faker import Faker

# Initialize Faker for Indian context
fake = Faker('en_IN')
random.seed(11)
Faker.seed(11)
NUM_USERS = 50
FILE_NAME = "users_seed.json"

EMAIL_PROVIDERS = ["gmail.com", "yahoo.co.in", "outlook.com", "icloud.com"]

users = []
used_emails = set()
used_phones = set()

EASY_PASSWORDS = ["Password@1234", "Project@1234", "Myproject@1234"]


for i in range(NUM_USERS):
    # Generate the deterministic UUID for this user
    user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"vendor_{i}"))

    # Set the first user as the explicit admin
    if i == 0:
        full_name = "Nikhil Chathapuram"
        email = "nikhilchathapuram@gmail.com"
        used_emails.add(email)
        role = "admin"
    else:
        full_name = fake.name()
        email_name = full_name.lower().replace(" ", "")
        provider = random.choice(EMAIL_PROVIDERS)
        email = f"{email_name}{i}@{provider}"
        while email in used_emails:
            email = f"{email_name}{random.randint(1000,9999)}@{provider}"
        used_emails.add(email)
        role = "user"

    # Unique Indian phone number
    phone = f"{random.randint(7, 9)}{random.randint(100000000, 999999999)}"
    while phone in used_phones:
        phone = f"{random.randint(7, 9)}{random.randint(100000000, 999999999)}"
    used_phones.add(phone)

    user_entry = {
        "id": user_uuid, # Added the generated UUID here
        "full_name": full_name,
        "email": email,
        "password_hash": random.choice(EASY_PASSWORDS),  # plain for seed (hash later if needed)
        "phone": phone,
        "role": role,
        "is_active": True if role == "admin" else (True if random.random() < 0.9 else False)
    }

    users.append(user_entry)


# Write JSON
with open(FILE_NAME, "w", encoding="utf-8") as f:
    json.dump(users, f, indent=2)

print(f"  {FILE_NAME} created with {NUM_USERS} users")