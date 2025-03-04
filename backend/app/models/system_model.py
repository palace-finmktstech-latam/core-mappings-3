from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, ClassVar
from datetime import datetime
import uuid
import json
import os

# In-memory storage (would be database in production)
SYSTEM_MODELS = {}

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

def init_system_models():
    """Initialize system models from storage or create defaults if none exist"""
    # Check if we have models saved in a file
    if os.path.exists("system_models.json"):
        with open("system_models.json", "r") as f:
            models_data = json.load(f)
            for model_data in models_data:
                model = SystemModel(**model_data)
                SYSTEM_MODELS[model.id] = model
    else:
        # Create default FX Forward model if no models exist
        fx_forward = SystemModel(
            id="fx-forward-v1",
            name="FX Forward",
            description="Standard model for FX Forward trades",
            version="1.0.0",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            fields=[
                FieldDefinition(
                    name="tradeId",
                    data_type="string",
                    description="Unique identifier for the trade",
                    required=True
                ),
                FieldDefinition(
                    name="baseCurrency",
                    data_type="string",
                    description="Base currency of the FX pair",
                    required=True
                ),
                FieldDefinition(
                    name="quoteCurrency",
                    data_type="string",
                    description="Quote currency of the FX pair",
                    required=True
                ),
                FieldDefinition(
                    name="amount",
                    data_type="decimal",
                    description="Amount of base currency",
                    required=True
                ),
                FieldDefinition(
                    name="rate",
                    data_type="decimal",
                    description="Exchange rate",
                    required=True
                ),
                FieldDefinition(
                    name="valueDate",
                    data_type="date",
                    description="Value date for the trade",
                    required=True
                ),
                FieldDefinition(
                    name="direction",
                    data_type="enum",
                    description="Trade direction (BUY or SELL)",
                    required=True,
                    constraints={"values": ["BUY", "SELL"]}
                ),
            ]
        )
        SYSTEM_MODELS[fx_forward.id] = fx_forward
        save_system_models()

def save_system_models():
    """Save system models to a file (would be database in production)"""
    models_data = [model.dict() for model in SYSTEM_MODELS.values()]
    with open("system_models.json", "w") as f:
        json.dump(models_data, f, default=str, indent=2)

def get_system_model(model_id: str) -> Optional[SystemModel]:
    """Get a system model by ID"""
    return SYSTEM_MODELS.get(model_id)

def get_all_system_models() -> List[SystemModel]:
    """Get all system models"""
    return list(SYSTEM_MODELS.values())

def create_system_model(model: dict) -> SystemModel:
    """Create a new system model"""
    model_id = model.get("id") or str(uuid.uuid4())
    now = datetime.now()
    
    # Create the model
    system_model = SystemModel(
        id=model_id,
        created_at=now,
        updated_at=now,
        **model
    )
    
    # Store it
    SYSTEM_MODELS[model_id] = system_model
    save_system_models()
    
    return system_model

def update_system_model(model_id: str, model: dict) -> Optional[SystemModel]:
    """Update an existing system model"""
    if model_id not in SYSTEM_MODELS:
        return None
    
    # Preserve creation date
    created_at = SYSTEM_MODELS[model_id].created_at
    
    # Create a copy of the model without the 'id' field
    model_copy = model.copy()
    if 'id' in model_copy:
        del model_copy['id']  # Remove the id to avoid the duplicate parameter
    
    # Update the model
    system_model = SystemModel(
        id=model_id,
        created_at=created_at,
        updated_at=datetime.now(),
        **model_copy
    )
    
    # Store it
    SYSTEM_MODELS[model_id] = system_model
    save_system_models()
    
    return system_model

def delete_system_model(model_id: str) -> bool:
    """Delete a system model"""
    if model_id not in SYSTEM_MODELS:
        return False
    
    del SYSTEM_MODELS[model_id]
    save_system_models()
    
    return True

# Initialize models when the module is imported
init_system_models()