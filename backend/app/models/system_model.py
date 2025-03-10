from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, ClassVar
from datetime import datetime

class FieldDefinition(BaseModel):
    """Definition of a field in a system model"""
    name: str
    data_type: str
    description: Optional[str] = None
    required: bool = False
    constraints: Optional[Dict[str, Any]] = None

class SystemModel(BaseModel):
    """A standard system model that defines the structure of data in the system"""
    id: str
    name: str
    description: Optional[str] = None
    version: str
    fields: List[FieldDefinition]
    created_at: datetime
    updated_at: datetime
    created_by: str = "system"  # In a real system, this would be the user ID

    class Config:
        schema_extra = {
            "example": {
                "id": "fx-forward-v1",
                "name": "FX Forward",
                "description": "Standard model for FX Forward trades",
                "version": "1.0.0",
                "fields": [
                    {
                        "name": "tradeId",
                        "data_type": "string",
                        "description": "Unique identifier for the trade",
                        "required": True
                    },
                    # Other fields...
                ]
            }
        }

# This function remains for compatibility during transition
async def get_system_model(model_id: str) -> Optional[SystemModel]:
    """Get a system model by ID (redirects to repository)"""
    # This will be imported at runtime to avoid circular imports
    from app.db.repositories import system_model_repository
    return await system_model_repository.get_by_id(model_id)