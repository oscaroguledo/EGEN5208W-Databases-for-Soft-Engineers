from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.db import engine, Base
from core.config import settings
from core.sessions import token_blacklist

from routes import members, trainers, admin, auth, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await token_blacklist.start_cleanup_task()

    yield

    # Shutdown
    await token_blacklist.stop_cleanup_task()


app = FastAPI(
    title=settings.APP_NAME,
    description="Health and Fitness Club Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(trainers.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"message": "Health and Fitness Club Management System API", "status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
