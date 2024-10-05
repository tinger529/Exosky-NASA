import json
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from numpy import double

from api.data_api import get_skyview_from_exoplanet

router = APIRouter()

@router.get("/skyview/")
async def get_star(ex_ra, ex_dec, ex_distance, ra, dec):
    skyview = get_skyview_from_exoplanet(int(ex_ra), int(ex_dec), double(ex_distance), int(ra), int(dec))
    
    return  JSONResponse(status_code=200, content={
        "name": skyview["name"],
        "ra": [str(it) for it in skyview["ra"]],
        "dec": [str(it) for it in skyview["dec"]],
        "vmag": [str(it) for it in skyview["brightness"]],
        "bv": [str(it) for it in skyview["bv"]],
    })
