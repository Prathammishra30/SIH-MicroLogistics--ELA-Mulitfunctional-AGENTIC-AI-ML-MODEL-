# ELA Python Service Configuration (Phase 4 Python Core)
import os
from pydantic import BaseModel


class ServiceConfig(BaseModel):
    host: str = os.getenv("ELA_HOST", "0.0.0.0")
    port: int = int(os.getenv("ELA_PORT", "8000"))
    node_backend_url: str = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
    service_name: str = "AgriRoute-ELA-Intelligence-Core"
    version: str = "4.0.0"
    environment: str = os.getenv("NODE_ENV", "development")


config = ServiceConfig()
