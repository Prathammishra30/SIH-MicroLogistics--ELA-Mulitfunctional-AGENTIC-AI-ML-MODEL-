# FastAPI Server Entrypoint for ELA AI/ML Service (Phase 4 Python Core)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from ai.ela.app.api import router
from ai.ela.app.config import config

app = FastAPI(
    title="AgriRoute ELA AI/ML Intelligence Core",
    description="Dedicated Agentic AI & Machine Learning Service for AgriRoute / RuralFlow",
    version=config.version,
)

# CORS middleware for local development and backend proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "service": config.service_name,
        "version": config.version,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
    }


if __name__ == "__main__":
    uvicorn.run("ai.ela.main:app", host=config.host, port=config.port, reload=False)
