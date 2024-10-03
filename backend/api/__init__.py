from fastapi import APIRouter
from .image import router as image_router

router = APIRouter()
router.include_router(image_router, prefix="/image")