import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection
from error_handlers import register_exception_handlers
from routes import auth, admin, hr, shared
from routes.shared import update_expired_job_statuses

app = FastAPI(title="Recruitment Portal API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000", "http://localhost:80", "http://13.204.47.60", "http://13.204.47.60:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(hr.router)
app.include_router(shared.router)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    # Start background task for checking expired jobs
    asyncio.create_task(periodic_job_status_check())

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

async def periodic_job_status_check():
    """
    Background task that runs every hour to check and update expired job statuses.
    """
    while True:
        try:
            # Check for expired jobs every hour (3600 seconds)
            await asyncio.sleep(3600)
            await update_expired_job_statuses()
            print("Background task: Checked and updated expired job statuses")
        except Exception as e:
            print(f"Background task error: {e}")
            # Continue running even if there's an error
            continue

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 