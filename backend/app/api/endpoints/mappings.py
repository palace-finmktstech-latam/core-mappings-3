from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Any
import csv
import io
from app.models.mapping import MappingConfig, FieldMapping
from app.models.system_model import FieldDefinition
from app.db.repositories import mapping_repository, system_model_repository
from app.services.transform_service import transform_data
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[MappingConfig])
async def list_mapping_configs():
    """List all mapping configurations"""
    return await mapping_repository.get_all()

@router.get("/{config_id}", response_model=MappingConfig)
async def get_mapping_config_endpoint(config_id: str):
    """Get a specific mapping configuration"""
    config = await mapping_repository.get_by_id(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Mapping configuration not found")
    return config

@router.post("/", response_model=MappingConfig)
async def create_mapping_config_endpoint(config: dict):
    """Create a new mapping configuration"""
    # Validate that the system model exists
    system_model = await system_model_repository.get_by_id(config.get("system_model_id"))
    if not system_model:
        raise HTTPException(status_code=400, detail="System model not found")
    
    # Validate target fields
    system_field_names = [field.name for field in system_model.fields]
    
    for mapping in config.get("mappings", []):
        if mapping["target_field"] not in system_field_names:
            raise HTTPException(
                status_code=400, 
                detail=f"Target field {mapping['target_field']} not found in system model"
            )
    
    return await mapping_repository.create(config)

@router.put("/{config_id}", response_model=MappingConfig)
async def update_mapping_config_endpoint(config_id: str, config: dict):
    """Update a mapping configuration"""
    logger.info(f"Updating mapping configuration: {config}")
    # Validate that the system model exists
    system_model = await system_model_repository.get_by_id(config.get("system_model_id"))
    if not system_model:
        raise HTTPException(status_code=400, detail="System model not found")
    
    # Validate target fields
    system_field_names = [field.name for field in system_model.fields]
    
    for mapping in config.get("mappings", []):
        if mapping["target_field"] not in system_field_names:
            raise HTTPException(
                status_code=400, 
                detail=f"Target field {mapping['target_field']} not found in system model"
            )
    
    updated_config = await mapping_repository.update(config_id, config)
    if not updated_config:
        raise HTTPException(status_code=404, detail="Mapping configuration not found")
    return updated_config

@router.delete("/{config_id}")
async def delete_mapping_config_endpoint(config_id: str):
    """Delete a mapping configuration"""
    success = await mapping_repository.delete(config_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mapping configuration not found")
    return {"message": "Mapping configuration deleted"}

@router.post("/upload-sample")
async def upload_sample_file(file: UploadFile = File(...)):
    """Upload a sample file and extract field definitions"""
    try:
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            # Parse CSV
            csv_text = contents.decode('utf-8')
            csv_reader = csv.reader(io.StringIO(csv_text))
            headers = next(csv_reader)
            
            # Create field definitions
            fields = [
                FieldDefinition(
                    name=field_name.strip(),
                    data_type="string",  # Default to string
                    required=False
                )
                for field_name in headers
            ]
            
            return {"fields": fields}
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/{config_id}/test")
async def test_mapping(config_id: str, test_data: Dict[str, Any]):
    """Test a mapping configuration with sample data"""
    config = await mapping_repository.get_by_id(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Mapping configuration not found")
    
    system_model = await system_model_repository.get_by_id(config.system_model_id)
    if not system_model:
        raise HTTPException(status_code=500, detail="Referenced system model not found")
    
    try:
        result = transform_data(test_data, config, system_model)
        return {
            "input": test_data,
            "output": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying mapping: {str(e)}")