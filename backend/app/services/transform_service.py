# backend/app/services/transform_service.py
from typing import Dict, Any
from datetime import datetime
from app.models.mapping import MappingConfig
from app.models.system_model import SystemModel

def transform_data(source_data: Dict[str, Any], mapping_config: MappingConfig, system_model: SystemModel) -> Dict[str, Any]:
    """Transform data from source format to system format using a mapping configuration"""
    result = {}
    
    for mapping in mapping_config.mappings:
        source_field = mapping.source_field
        target_field = mapping.target_field
        
        # Skip if source field isn't in the data
        if source_field not in source_data:
            continue
        
        # Get the source value
        source_value = source_data[source_field]
        
        # Apply transformation if defined
        if mapping.transformation:
            transformed_value = apply_transformation(source_value, mapping.transformation, source_data)
        else:
            transformed_value = source_value
        
        # Add to result
        result[target_field] = transformed_value
    
    # Validate the result against the system model
    validate_transformed_data(result, system_model)
    
    return result

def apply_transformation(value: Any, transformation: Dict[str, Any], source_data: Dict[str, Any]) -> Any:
    """Apply a transformation to a value"""
    transform_type = transformation.type
    params = transformation.params or {}
    
    if transform_type == "direct":
        return value
    
    elif transform_type == "format_date":
        try:
            # Convert date format
            source_format = params.get("source_format", "%d/%m/%Y")
            target_format = params.get("target_format", "%Y-%m-%d")
            
            # Parse the date string to a datetime object
            dt = datetime.strptime(value, source_format)
            
            # Format the datetime object back to a string
            return dt.strftime(target_format)
        except:
            # Return original value if transformation fails
            return value
    
    elif transform_type == "enum_map":
        # Map enum values
        mapping_dict = params.get("mapping", {})
        return mapping_dict.get(value, value)
    
    elif transform_type == "split":
        try:
            # Split string and get specified index
            delimiter = params.get("delimiter", ",")
            index = params.get("index", 0)
            parts = value.split(delimiter)
            return parts[index] if 0 <= index < len(parts) else value
        except:
            return value
    
    elif transform_type == "concat":
        try:
            # Concatenate multiple fields
            fields = params.get("fields", [])
            separator = params.get("separator", "")
            values = [source_data.get(field, "") for field in fields]
            values.append(str(value))  # Add the current field value
            return separator.join(str(v) for v in values if v)
        except:
            return value
    
    # Unknown transformation type
    return value

def validate_transformed_data(data: Dict[str, Any], system_model: SystemModel) -> None:
    """Validate transformed data against system model"""
    # Check required fields
    for field in system_model.fields:
        if field.required and field.name not in data:
            raise ValueError(f"Required field {field.name} is missing")
    
    # TODO: Add more validation (data types, constraints, etc.)