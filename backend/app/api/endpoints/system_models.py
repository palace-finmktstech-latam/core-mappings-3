# backend/app/api/endpoints/system_models.py
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.system_model import SystemModel
from app.db.repositories import system_model_repository
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[SystemModel])
async def list_system_models():
    """List all system models"""
    return await system_model_repository.get_all()

@router.get("/{model_id}", response_model=SystemModel)
async def get_system_model_endpoint(model_id: str):
    """Get a specific system model"""
    model = await system_model_repository.get_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="System model not found")
    return model

@router.post("/", response_model=SystemModel)
async def create_system_model_endpoint(model: dict):
    """Create a new system model (admin only)"""
    return await system_model_repository.create(model)

@router.put("/{model_id}", response_model=SystemModel)
async def update_system_model_endpoint(model_id: str, model: dict):
    logger.info(f"Updating system model with ID: {model_id}")
    """Update a system model (admin only)"""
    updated_model = await system_model_repository.update(model_id, model)
    if not updated_model:
        raise HTTPException(status_code=404, detail="System model not found")
    return updated_model

@router.delete("/{model_id}")
async def delete_system_model_endpoint(model_id: str):
    """Delete a system model (admin only)"""
    success = await system_model_repository.delete(model_id)
    if not success:
        raise HTTPException(status_code=404, detail="System model not found")
    return {"message": "System model deleted"}