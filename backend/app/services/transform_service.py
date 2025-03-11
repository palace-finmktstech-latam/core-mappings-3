# backend/app/services/transform_service.py
from typing import Dict, Any, Union
from datetime import datetime
import re
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
    # Handle both dictionary and object access patterns
    if hasattr(transformation, 'type'):
        transform_type = transformation.type
        params = transformation.params or {}
    else:
        transform_type = transformation.get("type")
        params = transformation.get("params", {})
    
    if transform_type == "direct":
        return value
    
    # String transformations
    elif transform_type == "left" and isinstance(value, str):
        try:
            count = int(params.get("count", 0))
            return value[:count]
        except:
            return value
    
    elif transform_type == "right" and isinstance(value, str):
        try:
            count = int(params.get("count", 0))
            return value[-count:] if count > 0 else value
        except:
            return value
    
    elif transform_type == "substring" and isinstance(value, str):
        try:
            start_pos = int(params.get("startPosition", 0))
            length = int(params.get("length", 0))
            return value[start_pos:start_pos + length]
        except:
            return value
    
    elif transform_type == "replace" and isinstance(value, str):
        try:
            find_str = params.get("find", "")
            replace_str = params.get("replace", "")
            replace_all = params.get("replaceAll", False)
            
            if replace_all:
                return value.replace(find_str, replace_str)
            else:
                return value.replace(find_str, replace_str, 1)
        except:
            return value
    
    elif transform_type == "case" and isinstance(value, str):
        try:
            case_type = params.get("caseType", "").lower()
            if case_type == "upper":
                return value.upper()
            elif case_type == "lower":
                return value.lower()
            elif case_type == "title":
                return value.title()
            return value
        except:
            return value
    
    elif transform_type == "regex" and isinstance(value, str):
        try:
            pattern = params.get("pattern", "")
            group = params.get("group", 0)  # Default to the entire match (group 0)
            
            # Try to match the pattern against the value
            match = re.search(pattern, value)
            
            if match:
                # Extract the specified group or the entire match if group=0
                return match.group(group)
            else:
                # No match found, return original value
                return value
        except Exception as e:
            print(f"Regex error: {str(e)}")
            return value
    
    elif transform_type == "split" and isinstance(value, str):
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
    
    # Date transformations
    elif transform_type == "format_date":
        try:
            # Convert date format
            source_format_str = params.get("source_format", "MM/DD/YYYY")
            target_format_str = params.get("target_format", "YYYY-MM-DD")
            
            # Convert user-friendly formats to Python datetime formats
            source_format = convert_date_format_to_python(source_format_str)
            target_format = convert_date_format_to_python(target_format_str)
            
            print(f"Original source_format: {source_format_str}")
            print(f"Converted Python source_format: {source_format}")
            print(f"Original target_format: {target_format_str}")
            print(f"Converted Python target_format: {target_format}")
            
            # Handle if value is already a datetime object
            if isinstance(value, datetime):
                dt = value
            else:
                # Parse the date string to a datetime object
                dt = datetime.strptime(str(value), source_format)
            
            # Format the datetime object back to a string
            return dt.strftime(target_format)
        except Exception as e:
            # Return original value if transformation fails
            print(f"Date transformation error: {str(e)}")
            return value
    
    # Numeric transformations
    elif transform_type == "numeric_format":
        try:
            if not isinstance(value, (int, float)):
                # Try to convert to number
                value = float(value)
                if value.is_integer():
                    value = int(value)
            
            # Apply formatting options
            decimal_places = params.get("decimalPlaces")
            if decimal_places is not None:
                value = round(float(value), decimal_places)
            
            return value
        except:
            return value
    
    # Boolean transformations
    elif transform_type == "boolean_convert":
        try:
            # Handle various boolean representations
            if isinstance(value, bool):
                return value
            
            true_values = params.get("trueValues", ["true", "yes", "1", "t", "y"])
            if str(value).lower() in map(str.lower, true_values):
                return True
            
            false_values = params.get("falseValues", ["false", "no", "0", "f", "n"])
            if str(value).lower() in map(str.lower, false_values):
                return False
            
            return bool(value)
        except:
            return value
    
    # Enum value mapping
    elif transform_type == "enum_map":
        # Map enum values
        mapping_dict = params.get("mapping", {})
        return mapping_dict.get(value, value)
    
    # Unknown transformation type
    return value

def validate_transformed_data(data: Dict[str, Any], system_model: SystemModel) -> None:
    """Validate transformed data against system model"""
    # Check required fields
    for field in system_model.fields:
        if field.required and field.name not in data:
            raise ValueError(f"Required field {field.name} is missing")
    
    # Validate data types
    for field_name, field_value in data.items():
        system_field = next((f for f in system_model.fields if f.name == field_name), None)
        if system_field:
            # Skip validation if field is not defined in the system model
            validate_field_value(field_name, field_value, system_field.data_type)

def validate_field_value(field_name: str, value: Any, data_type: str) -> None:
    """Validate a field value against its expected data type"""
    try:
        if data_type == "string":
            if value is not None and not isinstance(value, str):
                # Attempt to convert to string for display
                str(value)
                print(f"Note: Field {field_name} was automatically converted to string")
        
        elif data_type == "integer":
            if value is not None and not isinstance(value, int):
                # Try to convert string to int
                int(value)
                print(f"Note: Field {field_name} was validated as integer")
        
        elif data_type == "decimal":
            if value is not None and not isinstance(value, (int, float)):
                # Try to convert string to float
                float(value)
                print(f"Note: Field {field_name} was validated as decimal")
        
        elif data_type == "boolean":
            if value is not None and not isinstance(value, bool):
                # Boolean might be represented as string, int, etc.
                # Just check it can be interpreted as a boolean
                bool(value)
                print(f"Note: Field {field_name} was validated as boolean")
        
        elif data_type == "date":
            if value is not None:
                if isinstance(value, datetime):
                    # Already a datetime, no validation needed
                    pass
                elif isinstance(value, str):
                    # For date validation, we'll just verify it's a string for now
                    # The actual format validation happens during transformation
                    pass
                else:
                    raise ValueError(f"Field {field_name} should be a date string or datetime object")
        
        # Other data types could be added here
    
    except (ValueError, TypeError) as e:
        # Log the error but don't raise for now
        # This could be modified to raise exceptions based on your validation requirements
        print(f"Validation warning for field {field_name}: {str(e)}")

def convert_date_format_to_python(format_str):
    """Convert user-friendly date format to Python's datetime format"""
    # Translation mapping
    translation = {
        "MM": "%m",
        "M": "%m",
        "DD": "%d",
        "D": "%d",
        "YYYY": "%Y",
        "YY": "%y"
    }
    
    # Replace each pattern with its Python equivalent
    result = format_str
    for pattern, replacement in translation.items():
        result = result.replace(pattern, replacement)
    
    # Handle separators
    result = result.replace("/", "/").replace("-", "-")
    
    return result

