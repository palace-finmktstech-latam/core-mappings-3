# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import system_models, mappings
import logging
import os
from dotenv import load_dotenv
from app.db.database import connect_to_mongo, close_mongo_connection

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Trade Data Mapping Tool",
    description="API for configuring and testing data mappings",
    version="0.1.0"
)

# Log application startup
logger.info("Starting Trade Data Mapping Tool API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB on startup and initialize data
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    
    # Initialize default system models if needed
    from app.db.repositories import system_model_repository
    await system_model_repository.init_default_models()

# Close MongoDB connection on shutdown
@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include API routes
app.include_router(system_models.router, prefix="/api/system-models", tags=["system-models"])
app.include_router(mappings.router, prefix="/api/mappings", tags=["mappings"])

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to the Trade Data Mapping Tool API"}

@app.get("/test-logging")
async def test_logging():
    logger.debug("This is a DEBUG message")
    logger.info("This is an INFO message")
    logger.warning("This is a WARNING message")
    logger.error("This is an ERROR message")
    return {"message": "Logging test complete"}