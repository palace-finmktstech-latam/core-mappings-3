from app.db.repositories.system_model_repository import SystemModelRepository
from app.db.repositories.mapping_repository import MappingRepository

# Singleton instances
system_model_repository = SystemModelRepository()
mapping_repository = MappingRepository()