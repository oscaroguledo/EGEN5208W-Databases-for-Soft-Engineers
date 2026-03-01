from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.db import engine, Base
from core.config import settings

from routes import members, trainers, admin, auth

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Health and Fitness Club Management System API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(trainers.router)
app.include_router(admin.router)

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Health and Fitness Club Management System API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
