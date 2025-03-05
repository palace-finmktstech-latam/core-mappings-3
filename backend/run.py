# Test script to run the FastAPI application
import uvicorn
import logging
import sys

# Configure root logger
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(sys.stdout)  # Explicitly use stdout
    ]
)

# Create a test log message
logger = logging.getLogger("run")
logger.info("Starting application from run.py")

# Configure uvicorn logger
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.setLevel(logging.INFO)

# Configure FastAPI logger
fastapi_logger = logging.getLogger("fastapi")
fastapi_logger.setLevel(logging.DEBUG)

# Configure app loggers
app_logger = logging.getLogger("app")
app_logger.setLevel(logging.DEBUG)

if __name__ == "__main__":
    # This will run the FastAPI application on port 8000
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="debug",
        access_log=True
    )