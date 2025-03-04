from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import json
import os
from app.models.system_model import get_system_model, FieldDefinition

# In-memory storage (would be database in production)
MAPPING_CONFIGS = {}

class TransformationType(str):
    DIRECT = "direct"
    FORMAT_DATE = "format_date"
    ENUM_MAP = "enum_map"
    SPLIT = "split"
    CONCAT = "concat"

class TransformationRule(BaseModel):
    """Rule for transforming data between formats"""
    type: str
    params: Optional[Dict[str, Any]] = None

class FieldMapping(BaseModel):
    """Mapping between a source field and a target field"""
    source_field: str
    target_field: str
    transformation: Optional[TransformationRule] = None

class MappingConfig(BaseModel):
    """Configuration for mapping bank-specific formats to system formats"""
    id: str
    name: str
    description: Optional[str] = None
    bank_id: str
    system_model_id: str  # References a SystemModel
    source_fields: List[FieldDefinition]
    mappings: List[FieldMapping]
    created_at: datetime
    updated_at: datetime

    @validator('mappings')
    def validate_target_fields(cls, v, values):
        """Validate that all target fields exist in the referenced system model"""
        if 'system_model_id' not in values:
            return v
        
        system_model = get_system_model(values['system_model_id'])
        if not system_model:
            raise ValueError(f"System model with ID {values['system_model_id']} not found")
        
        system_field_names = [field.name for field in system_model.fields]
        
        for mapping in v:
            if mapping.target_field not in system_field_names:
                raise ValueError(f"Target field {mapping.target_field} not found in system model")
        
        return v

def init_mapping_configs():
    """Initialize mapping configurations from storage"""
    if os.path.exists("mapping_configs.json"):
        with open("mapping_configs.json", "r") as f:
            configs_data = json.load(f)
            for config_data in configs_data:
                config = MappingConfig(**config_data)
                MAPPING_CONFIGS[config.id] = config

def save_mapping_configs():
    """Save mapping configurations to a file"""
    configs_data = [config.dict() for config in MAPPING_CONFIGS.values()]
    with open("mapping_configs.json", "w") as f:
        json.dump(configs_data, f, default=str, indent=2)

def get_mapping_config(config_id: str) -> Optional[MappingConfig]:
    """Get a mapping configuration by ID"""
    return MAPPING_CONFIGS.get(config_id)

def get_all_mapping_configs() -> List[MappingConfig]:
    """Get all mapping configurations"""
    return list(MAPPING_CONFIGS.values())

def create_mapping_config(config: dict) -> MappingConfig:
    """Create a new mapping configuration"""
    config_id = str(uuid.uuid4())
    now = datetime.now()
    
    # Create the config
    mapping_config = MappingConfig(
        id=config_id,
        created_at=now,
        updated_at=now,
        **config
    )
    
    # Store it
    MAPPING_CONFIGS[config_id] = mapping_config
    save_mapping_configs()
    
    return mapping_config

def update_mapping_config(config_id: str, config: dict) -> Optional[MappingConfig]:
    """Update an existing mapping configuration"""
    if config_id not in MAPPING_CONFIGS:
        return None
    
    # Preserve creation date
    created_at = MAPPING_CONFIGS[config_id].created_at
    
    # Update the config
    mapping_config = MappingConfig(
        id=config_id,
        created_at=created_at,
        updated_at=datetime.now(),
        **config
    )
    
    # Store it
    MAPPING_CONFIGS[config_id] = mapping_config
    save_mapping_configs()
    
    return mapping_config

def delete_mapping_config(config_id: str) -> bool:
    """Delete a mapping configuration"""
    if config_id not in MAPPING_CONFIGS:
        return False
    
    del MAPPING_CONFIGS[config_id]
    save_mapping_configs()
    
    return True

# Initialize configurations when the module is imported
init_mapping_configs()