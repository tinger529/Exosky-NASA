import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.data_api import get_skyview_from_exoplanet, get_skyview_from_earth

router = APIRouter()

class SkyviewParams(BaseModel):
    ex_ra: Optional[float] = None
    ex_dec: Optional[float] = None
    ex_distance: Optional[float] = None
    ra: float
    dec: float
    
@router.post("/skyview/exoplanet")
async def get_star_from_exoplanet(params: SkyviewParams):
    """
    Retrieve stars from exoplanet by given params.
    Param:
    {
        "ex_ra": float,
        "ex_dec": float,
        "ex_distance": float,
        "ra": float,
        "dec": float
    }
    """
    skyview = get_skyview_from_exoplanet(
        params.ex_ra,
        params.ex_dec,
        params.ex_distance,
        params.ra,
        params.dec
    )

    return JSONResponse(status_code=200, content={
        "name": skyview["name"],
        "ra": [str(it) for it in skyview["ra"]],
        "dec": [str(it) for it in skyview["dec"]],
        "vmag": [str(it) for it in skyview["brightness"]],
        "bv": [str(it) for it in skyview["bv"]],
    })
    
@router.post("/skyview/earth/")
async def get_star_from_earth2(params: SkyviewParams):
    """
    Retrieve stars from earth by given Right Ascension (ra) and Declination (dec).
    Param:
    {
        "ra": float,
        "dec": float
    }
    """
    ra = params.ra
    dec = params.dec
    
    skyview = get_skyview_from_earth(int(ra), int(dec))
    
    return JSONResponse(status_code=200, content={
        "name": skyview["name"],
        "ra": [str(it) for it in skyview["ra"]],
        "dec": [str(it) for it in skyview["dec"]],
        "vmag": [str(it) for it in skyview["brightness"]],
        "bv": [str(it) for it in skyview["bv"]],
    })