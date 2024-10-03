import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api import router as api_router

app = FastAPI()

static_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_directory), name="static")


@app.get("/")
async def serve_react_frontend():
    return FileResponse(static_directory+ "/index.html")

app.include_router(api_router, prefix="/api/v1")