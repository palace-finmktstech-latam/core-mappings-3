from app.db.database import db
from app.models.system_model import SystemModel
from typing import List, Optional
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class SystemModelRepository:
    collection_name = "system_models"

    @property
    def collection(self):
        return db.db[self.collection_name]

    async def get_all(self) -> List[SystemModel]:
        """Get all system models"""
        cursor = self.collection.find()
        models = await cursor.to_list(length=100)  # Limit to 100 models for now
        return [SystemModel(**model) for model in models]

    async def get_by_id(self, model_id: str) -> Optional[SystemModel]:
        """Get a system model by ID"""
        model = await self.collection.find_one({"id": model_id})
        if model:
            return SystemModel(**model)
        return None

    async def create(self, model_data: dict) -> SystemModel:
        """Create a new system model"""
        model_id = model_data.get("id") or str(uuid.uuid4())
        now = datetime.now()
        
        # Create the model
        system_model = SystemModel(
            id=model_id,
            created_at=now,
            updated_at=now,
            **model_data
        )
        
        # Store it in MongoDB
        await self.collection.insert_one(system_model.dict())
        
        return system_model

    async def update(self, model_id: str, model_data: dict) -> Optional[SystemModel]:
        """Update an existing system model"""
        # Get the existing model
        existing = await self.get_by_id(model_id)
        if not existing:
            return None
        
        # Preserve creation date
        created_at = existing.created_at
        
        # Create a copy of the model data without the 'id' field
        model_copy = model_data.copy()
        if 'id' in model_copy:
            del model_copy['id']  # Remove the id to avoid duplicate parameter
        
        # Update the model
        system_model = SystemModel(
            id=model_id,
            created_at=created_at,
            updated_at=datetime.now(),
            **model_copy
        )
        
        # Update in MongoDB
        await self.collection.replace_one({"id": model_id}, system_model.dict())
        
        return system_model

    async def delete(self, model_id: str) -> bool:
        """Delete a system model"""
        result = await self.collection.delete_one({"id": model_id})
        return result.deleted_count > 0

    async def init_default_models(self):
        """Initialize default system models if none exist"""
        count = await self.collection.count_documents({})
        if count == 0:
            # Create default FX Forward model
            await self.create({
                "id": "fx-forward-v1",
                "name": "FX Forward",
                "description": "Standard model for FX Forward trades",
                "version": "1.0.0",
                "created_by": "system",
                "fields": [
                    {
                        "name": "tradeId",
                        "data_type": "string",
                        "description": "Unique identifier for the trade",
                        "required": True
                    },
                    {
                        "name": "baseCurrency",
                        "data_type": "string",
                        "description": "Base currency of the FX pair",
                        "required": True
                    },
                    {
                        "name": "quoteCurrency",
                        "data_type": "string",
                        "description": "Quote currency of the FX pair",
                        "required": True
                    },
                    {
                        "name": "amount",
                        "data_type": "decimal",
                        "description": "Amount of base currency",
                        "required": True
                    },
                    {
                        "name": "rate",
                        "data_type": "decimal",
                        "description": "Exchange rate",
                        "required": True
                    },
                    {
                        "name": "valueDate",
                        "data_type": "date",
                        "description": "Value date for the trade",
                        "required": True
                    },
                    {
                        "name": "direction",
                        "data_type": "enum",
                        "description": "Trade direction (BUY or SELL)",
                        "required": True,
                        "constraints": {"values": ["BUY", "SELL"]}
                    }
                ]
            })