import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from matplotlib.pyplot import flag
from pydantic import BaseModel

from api.data_api import get_skyview_from_exoplanet, get_skyview_from_earth

router = APIRouter()


class SkyviewParams(BaseModel):
    ex_ra: Optional[float] = None
    ex_dec: Optional[float] = None
    ex_distance: Optional[float] = None
    ra: float
    dec: float


class Star():
    def __init__(self, name: str, ra: float, dec: float, vmag: float, bv: float):
        self.name = name
        self.ra = ra
        self.dec = dec
        self.vmag = vmag
        self.bv = bv

    def to_dict(self):
        return {
            "name": self.name,
            "ra": str(self.ra),
            "dec": str(self.dec),
            "vmag": str(self.vmag),
            "bv": str(self.bv)
        }


@router.post("/skyview/exoplanet/")
async def get_stars_from_exoplanet(params: SkyviewParams):
    """
    Retrieve stars from exoplanet by given params:
    Exoplanet Right Ascension (ex_ra), Exoplanet Declination (ex_dec), Exoplanet Distance (ex_distance), Right Ascension (ra) and Declination (dec).
    """

    print(params)

    if (params.ex_ra is None or params.ex_dec is None or 
        params.ex_distance is None or params.ex_distance < 0 or
        params.ra is None or params.dec is None):
        raise HTTPException(status_code=400, detail="Invalid parameters")

    
    skyview = get_skyview_from_exoplanet(
        params.ex_ra,
        params.ex_dec,
        params.ex_distance,
        params.ra,
        params.dec
    )
    
    star_list = []
    
    for i in range(len(skyview["name"])):
        star_list.append(Star(
            skyview["name"][i], skyview["ra"][i], skyview["dec"][i], skyview["brightness"][i], skyview["bv"][i],
        ))
    
    star_dict = [star.to_dict() for star in star_list]
    
    # Return the list of star dictionaries directly
    return JSONResponse(status_code=200, content={"stars": star_dict})
    
@router.post("/skyview/earth/")
async def get_stars_from_earth(params: SkyviewParams):
    """
    Retrieve stars from earth by given Right Ascension (ra) and Declination (dec).
    """
    if (params.ex_ra or params.ex_dec or params.ex_distance):
        raise HTTPException(status_code=400, detail="Invalid parameters")
    
    ra = params.ra
    dec = params.dec
    
    skyview = get_skyview_from_earth(int(ra), int(dec))
    
    star_list = []
    
    for i in range(len(skyview["name"])):
        star_list.append(Star(
            skyview["name"][i], skyview["ra"][i], skyview["dec"][i], skyview["brightness"][i], skyview["bv"][i],
        ))
    
    star_dict = [star.to_dict() for star in star_list]
    
    return JSONResponse(status_code=200, content={"stars":star_dict})
