from fastapi import APIRouter, HTTPException
from typing import Optional
from astroquery.simbad import Simbad
from pydantic import BaseModel

router = APIRouter()

class StarInfo(BaseModel):
    name: str
    ra: str
    dec: str
    distance: str

@router.get("/info", response_model=StarInfo)
async def get_star_info(
    name: Optional[str] = None,
    ra: Optional[str] = None,
    dec: Optional[str] = None,
):
    """
    Get star information based on name, RA, or DEC.
    Example queries:
    - /star/info?name=Orion
    - /star/info?ra=5h35m17.3s&dec=-5d27m18s
    """
    if name:
        result = Simbad.query_object(name)
    elif ra and dec:
        query = f"RA:{ra}, DEC:{dec}"
        result = Simbad.query_object(query)
    else:
        raise HTTPException(status_code=400, detail="Either 'name' or both 'ra' and 'dec' must be provided")

    if result is None or len(result) == 0:
        raise HTTPException(status_code=404, detail="Star not found")

    star_info = StarInfo(
        name=result["MAIN_ID"][0],
        ra=result["RA"][0],
        dec=result["DEC"][0],
        distance=result["PLX_VALUE"][0] if "PLX_VALUE" in result.colnames else "Unknown"
    )
    
    return star_info
