from fastapi import APIRouter

from .image import router as image_router
from .star import router as star_router
from .exoplanet import router as exoplanet_router

router = APIRouter()
router.include_router(image_router, prefix="/star")
router.include_router(star_router, prefix="/star")
router.include_router(exoplanet_router, prefix="/exoplanet")