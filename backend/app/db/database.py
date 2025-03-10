from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from pymongo.database import Database
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# MongoDB Atlas connection details
#MONGODB_URI = os.environ.get("MONGODB_URI")
# Temporary hardcoded URI for testing
MONGODB_URI = "mongodb+srv://benclark:IDTJTZ5uAUSD0yfl@palaceai.kgogr.mongodb.net/?retryWrites=true&w=majority&appName=PalaceAI"
MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "data_mapping_db")

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[Database] = None

db = MongoDB()

async def connect_to_mongo():
    """Create connection to MongoDB Atlas."""
    logger.info("Connecting to MongoDB Atlas")
    
    # Print environment variables for debugging
    logger.info(f"MONGODB_URI from env: {MONGODB_URI}")
    logger.info(f"MONGODB_DB_NAME from env: {MONGODB_DB_NAME}")
    
    if not MONGODB_URI:
        error_msg = "MONGODB_URI environment variable not found"
        logger.error(error_msg)
        raise ValueError(error_msg)
        
    db.client = AsyncIOMotorClient(
        MONGODB_URI, 
        server_api=ServerApi('1')
    )
    db.db = db.client[MONGODB_DB_NAME]
    
    # Verify connection
    try:
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB Atlas: {e}")
        raise

async def close_mongo_connection():
    """Close database connection."""
    logger.info("Closing MongoDB connection")
    if db.client:
        db.client.close()
    logger.info("MongoDB connection closed")

# Add this for direct module testing
if __name__ == "__main__":
    import asyncio
    asyncio.run(connect_to_mongo())
    print("Database connection test complete")
    asyncio.run(close_mongo_connection())