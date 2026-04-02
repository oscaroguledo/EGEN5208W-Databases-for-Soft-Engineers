from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.db import engine, Base
from core.config import settings
from core.sessions import session_store

from routes import members, trainers, admin, auth, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown events"""
    # Startup: Create database tables and start session cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start session cleanup background task
    await session_store.start_cleanup_task()
    
    yield
    
    # Shutdown: Stop session cleanup
    await session_store.stop_cleanup_task()


# Create FastAPI app with lifespan
app = FastAPI(
    title=settings.APP_NAME,
    description="Health and Fitness Club Management System API",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(trainers.router)
app.include_router(admin.router)


# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Health and Fitness Club Management System API", "status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
