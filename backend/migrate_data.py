import asyncio
import json
import os
import logging
from dotenv import load_dotenv
from app.db.database import connect_to_mongo, close_mongo_connection
from app.db.repositories import system_model_repository, mapping_repository
from app.models.system_model import SystemModel
from app.models.mapping import MappingConfig

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_system_models():
    """Migrate system models from JSON file to MongoDB"""
    if os.path.exists("system_models.json"):
        logger.info("Migrating system models from JSON file")
        with open("system_models.json", "r") as f:
            models_data = json.load(f)
            for model_data in models_data:
                # Check if model already exists
                existing = await system_model_repository.get_by_id(model_data["id"])
                if not existing:
                    logger.info(f"Migrating system model: {model_data['name']}")
                    model = SystemModel(**model_data)
                    await system_model_repository.collection.insert_one(model.dict())
                else:
                    logger.info(f"System model already exists: {model_data['name']}")
        logger.info("System models migration completed")
    else:
        logger.info("No system models file found, skipping migration")

async def migrate_mapping_configs():
    """Migrate mapping configurations from JSON file to MongoDB"""
    if os.path.exists("mapping_configs.json"):
        logger.info("Migrating mapping configurations from JSON file")
        with open("mapping_configs.json", "r") as f:
            configs_data = json.load(f)
            for config_data in configs_data:
                # Check if config already exists
                existing = await mapping_repository.get_by_id(config_data["id"])
                if not existing:
                    logger.info(f"Migrating mapping config: {config_data['name']}")
                    config = MappingConfig(**config_data)
                    await mapping_repository.collection.insert_one(config.dict())
                else:
                    logger.info(f"Mapping config already exists: {config_data['name']}")
        logger.info("Mapping configurations migration completed")
    else:
        logger.info("No mapping configurations file found, skipping migration")

async def main():
    """Main migration function"""
    logger.info("Starting migration")
    await connect_to_mongo()
    
    await migrate_system_models()
    await migrate_mapping_configs()
    
    await close_mongo_connection()
    logger.info("Migration completed")

if __name__ == "__main__":
    asyncio.run(main())