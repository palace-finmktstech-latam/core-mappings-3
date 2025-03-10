from app.db.database import db
from app.models.mapping import MappingConfig
from typing import List, Optional
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class MappingRepository:
    collection_name = "mapping_configs"

    @property
    def collection(self):
        return db.db[self.collection_name]

    async def get_all(self) -> List[MappingConfig]:
        """Get all mapping configurations"""
        cursor = self.collection.find()
        configs = await cursor.to_list(length=100)  # Limit to 100 configs for now
        return [MappingConfig(**config) for config in configs]

    async def get_by_id(self, config_id: str) -> Optional[MappingConfig]:
        """Get a mapping configuration by ID"""
        config = await self.collection.find_one({"id": config_id})
        if config:
            return MappingConfig(**config)
        return None

    async def create(self, config_data: dict) -> MappingConfig:
        """Create a new mapping configuration"""
        config_id = str(uuid.uuid4())
        now = datetime.now()
        
        # Create the config
        mapping_config = MappingConfig(
            id=config_id,
            created_at=now,
            updated_at=now,
            **config_data
        )
        
        # Store it in MongoDB
        await self.collection.insert_one(mapping_config.dict())
        
        return mapping_config

    async def update(self, config_id: str, config_data: dict) -> Optional[MappingConfig]:
        """Update an existing mapping configuration"""
        # Get the existing config
        existing = await self.get_by_id(config_id)
        if not existing:
            return None
        
        # Preserve creation date
        created_at = existing.created_at
        
        # Create a copy of the config data without the 'id' field
        config_copy = config_data.copy()
        if 'id' in config_copy:
            del config_copy['id']  # Remove the id to avoid duplicate parameter
        
        # Update the config
        mapping_config = MappingConfig(
            id=config_id,
            created_at=created_at,
            updated_at=datetime.now(),
            **config_copy
        )
        
        # Update in MongoDB
        await self.collection.replace_one({"id": config_id}, mapping_config.dict())
        
        return mapping_config

    async def delete(self, config_id: str) -> bool:
        """Delete a mapping configuration"""
        result = await self.collection.delete_one({"id": config_id})
        return result.deleted_count > 0