import asyncio
from database import connect_to_mongo, close_mongo_connection
from pymongo import ASCENDING
from bson import ObjectId

async def cleanup_duplicates():
    """
    Remove duplicate entries from job_history collection based on original_job_id
    Keep the most recent entry for each original_job_id
    """
    try:
        # Connect to MongoDB
        await connect_to_mongo()
        
        # Get database connection
        from database import get_database
        db = await get_database()
        
        # Find all documents grouped by original_job_id
        pipeline = [
            {
                "$group": {
                    "_id": "$original_job_id",
                    "documents": {"$push": "$$ROOT"},
                    "count": {"$sum": 1}
                }
            },
            {
                "$match": {
                    "count": {"$gt": 1}
                }
            }
        ]
        
        duplicates = await db.recruitment_portal.job_history.aggregate(pipeline).to_list(length=None)
        
        if not duplicates:
            print("No duplicate entries found in job_history collection")
            return
        
        print(f"Found {len(duplicates)} original_job_ids with duplicate entries")
        
        # Process each group of duplicates
        total_removed = 0
        for duplicate_group in duplicates:
            original_job_id = duplicate_group["_id"]
            documents = duplicate_group["documents"]
            
            print(f"Processing duplicates for original_job_id: {original_job_id}")
            print(f"  Found {len(documents)} duplicate entries")
            
            # Sort documents by creation date (keep the most recent)
            # If no creation date, keep the first one
            documents.sort(key=lambda x: x.get('created_at', x.get('_id').generation_time), reverse=True)
            
            # Keep the first (most recent) document, remove the rest
            documents_to_remove = documents[1:]
            
            # Remove duplicate documents
            for doc in documents_to_remove:
                result = await db.recruitment_portal.job_history.delete_one({"_id": doc["_id"]})
                if result.deleted_count > 0:
                    total_removed += 1
                    print(f"  Removed duplicate document: {doc['_id']}")
            
            print(f"  Kept document: {documents[0]['_id']}")
        
        print(f"Total duplicate documents removed: {total_removed}")
        
    except Exception as e:
        print(f"Error cleaning up duplicates: {e}")
        raise

async def create_job_history_index():
    """
    Create a unique index on the original_job_id field in the job_history collection
    to prevent duplicate entries at the database level.
    """
    try:
        # Connect to MongoDB
        await connect_to_mongo()
        
        # Get database connection
        from database import get_database
        db = await get_database()
        
        # Create unique index on original_job_id field
        result = await db.recruitment_portal.job_history.create_index(
            "original_job_id", 
            unique=True,
            background=True
        )
        
        print(f"Successfully created unique index on original_job_id field")
        print(f"Index name: {result}")
        
        # List all indexes to verify
        indexes = await db.recruitment_portal.job_history.list_indexes().to_list(length=10)
        print("Current indexes in job_history collection:")
        for index in indexes:
            print(f"  - {index['name']}: {index['key']}")
            
    except Exception as e:
        print(f"Error creating index: {e}")
    finally:
        # Close MongoDB connection
        await close_mongo_connection()

async def main():
    """
    Main function to clean up duplicates and create the index
    """
    try:
        print("Step 1: Cleaning up duplicate entries...")
        await cleanup_duplicates()
        
        print("\nStep 2: Creating unique index...")
        await create_job_history_index()
        
        print("\nProcess completed successfully!")
        
    except Exception as e:
        print(f"Error in main process: {e}")
    finally:
        # Close MongoDB connection
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
