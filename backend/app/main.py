# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import system_models, mappings

app = FastAPI(
    title="Trade Data Mapping Tool",
    description="API for configuring and testing data mappings",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(system_models.router, prefix="/api/system-models", tags=["system-models"])
app.include_router(mappings.router, prefix="/api/mappings", tags=["mappings"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Trade Data Mapping Tool API"}