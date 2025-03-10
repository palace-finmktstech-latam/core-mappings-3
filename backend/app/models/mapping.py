from pydantic import BaseModel, validator
from typing import List, Dict, Any, Optional
from datetime import datetime
import enum
from app.models.system_model import FieldDefinition

class TransformationType(str, enum.Enum):
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
        # Skip validation during deserialization from DB
        # This is now handled at the API level
        return v

# This function remains for compatibility during transition
async def get_mapping_config(config_id: str) -> Optional[MappingConfig]:
    """Get a mapping configuration by ID (redirects to repository)"""
    # This will be imported at runtime to avoid circular imports
    from app.db.repositories import mapping_repository
    return await mapping_repository.get_by_id(config_id)