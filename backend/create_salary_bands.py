import asyncio
import motor.motor_asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "recruitment_portal"

async def create_salary_bands():
    """Create salary_bands collection and populate with data"""
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Salary bands data from the image
    salary_bands_data = [
        {
            "band": "6A",
            "experience_range": "1-3 years",
            "standard": 310,
            "ra1": 388,
            "ra2": 403,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "band": "6B", 
            "experience_range": "3-5 years",
            "standard": 478,
            "ra1": 596,
            "ra2": 620,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "band": "7A",
            "experience_range": "5-7 Years", 
            "standard": 661,
            "ra1": 803,
            "ra2": 832,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "band": "7B",
            "experience_range": "7-9 yrs",
            "standard": 823,
            "ra1": 977,
            "ra2": 1016,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "band": "8",
            "experience_range": None,  # No experience range specified
            "standard": 1064,
            "ra1": 1263,
            "ra2": 1327,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "band": "9",
            "experience_range": None,  # No experience range specified
            "standard": 1216,
            "ra1": 1712,
            "ra2": 1790,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    try:
        # Drop existing collection if it exists
        await db.salary_bands.drop()
        print("✅ Dropped existing salary_bands collection")
        
        # Create new collection and insert data
        result = await db.salary_bands.insert_many(salary_bands_data)
        
        print(f"✅ Successfully created salary_bands collection")
        print(f"✅ Inserted {len(result.inserted_ids)} salary bands")
        
        # Verify the data by fetching and displaying
        print("\n📋 Salary Bands Data:")
        print("-" * 80)
        print(f"{'Band':<8} {'Experience':<15} {'Standard':<10} {'RA1':<8} {'RA2':<8}")
        print("-" * 80)
        
        async for band in db.salary_bands.find().sort("band", 1):
            experience = band.get("experience_range") or "N/A"
            print(f"{band['band']:<8} {experience:<15} {band['standard']:<10} {band['ra1']:<8} {band['ra2']:<8}")
        
        print("-" * 80)
        print("✅ Salary bands data successfully created and verified!")
        
    except Exception as e:
        print(f"❌ Error creating salary bands: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 Creating salary bands collection...")
    asyncio.run(create_salary_bands())
    print("✅ Script completed!")
