from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import engine, Base
from app.models import Contract, Clause
from app.routers.contracts import router as contracts_router


app = FastAPI(
    title="Contract Risk Intelligence API",
    description="Evidence-grounded contract risk and obligation analysis system",
    version="1.0.0"
)


# Create tables if they don't already exist
Base.metadata.create_all(bind=engine)


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Contract routes
app.include_router(contracts_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "contract-risk-intelligence-backend"
    }