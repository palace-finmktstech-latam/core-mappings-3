from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

# Transformation types
class TransformationType(str, Enum):
    DIRECT = "direct"
    FORMAT_DATE = "format_date"
    ENUM_MAP = "enum_map"
    SPLIT = "split"
    CONCAT = "concat"

# Field definition schema
class FieldDefinition(BaseModel):
    name: str
    data_type: str
    description: Optional[str] = None
    required: bool = False
    constraints: Optional[Dict[str, Any]] = None

# Transformation rule schema
class TransformationRule(BaseModel):
    type: TransformationType
    params: Optional[Dict[str, Any]] = None

# Field mapping schema
class FieldMapping(BaseModel):
    source_field: str
    target_field: str
    transformation: Optional[TransformationRule] = None

# Base mapping configuration schema (shared properties)
class MappingConfigBase(BaseModel):
    name: str
    description: Optional[str] = None
    bank_id: str
    instrument_type: str

# Schema for creating a new mapping configuration
class MappingConfigCreate(MappingConfigBase):
    source_fields: List[FieldDefinition]
    target_fields: List[FieldDefinition]
    mappings: List[FieldMapping]

# Schema for returning a mapping configuration
class MappingConfig(MappingConfigBase):
    id: str
    source_fields: List[FieldDefinition]
    target_fields: List[FieldDefinition]
    mappings: List[FieldMapping]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True  # Allows conversion from ORM objects