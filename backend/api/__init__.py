from fastapi import APIRouter

from .image import router as image_router
from .exoplanet import router as exoplanet_router
from .sample import router as sample_router

router = APIRouter()
router.include_router(image_router, prefix="/exoplanet")
router.include_router(exoplanet_router, prefix="/exoplanet")
router.include_router(sample_router, prefix="/exoplanet")