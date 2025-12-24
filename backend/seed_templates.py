import asyncio
import os
import sys

# Add the parent directory to sys.path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import settings

templates = [
    {
        "name": "Illumina NovaSeq",
        "description": "Standard audit template for NovaSeq runs",
        "columns": ["Flowcell ID", "Sample ID", "Lane", "Index"]
    },
    {
        "name": "10x Chromium",
        "description": "Audit template for 10x Genomics Chromium single cell runs",
        "columns": ["GemCode", "Sample Name", "Barcode"]
    }
]

async def seed():
    print(f"Connecting to MongoDB at {settings.mongodb_uri}...")
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.db_name]
    collection = db["templates"]

    print("Seeding templates...")
    for template in templates:
        result = await collection.update_one(
            {"name": template["name"]},
            {"$set": template},
            upsert=True
        )
        if result.upserted_id:
            print(f"Created template: {template['name']}")
        elif result.modified_count > 0:
            print(f"Updated template: {template['name']}")
        else:
            print(f"Template already exists: {template['name']}")

    print("Seeding complete.")
    client.close()

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(seed())
    loop.close()