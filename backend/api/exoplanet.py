from fastapi import APIRouter, HTTPException
from fastapi.routing import APIRoute
import pandas as pd
import csv
import os

sample_data = {}
router = APIRouter()

@router.get("/all")
async def get_exoplanet_list():
    global sample_data
    
    if not sample_data:
        get_exoplanet_dict()
        
    return {
        "pl_name": list(sample_data.keys())
    }

@router.get("/{pl_name}")
async def get_exoplanet(pl_name: str):
    """
    Retrieve sample information based on the pl_name.
    Example: /exoplanet/11%20Com%20b
    """
    global sample_data
    
    if not sample_data:
        get_exoplanet_dict()
    
    if pl_name in sample_data:
        return {
            "pl_name": pl_name,
            "data": sample_data[pl_name]
        }
    else:
        raise HTTPException(status_code=404, detail=f"Sample '{pl_name}' not found")
    

def get_exoplanet_dict():
    file_path = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "../static/Exoplanet.csv")

    global sample_data

    with open(file_path, 'r') as file:
        reader = csv.reader(file)
        header = next(reader)

        for row in reader:
            if not row[0].startswith('#') and row[0] != "pl_name":
                sample_data[row[0]] = row[1:]
                
    # Two dimensional view
    # frame_data = pd.DataFrame(sample_data)
                
    return sample_data

if __name__ == "__init__":
    get_exoplanet_dict()


"""
Indices

0: Planet Name: 'pl_name', 
1: Host Name: 'hostname', 
2: Orbital Period [days]: 'pl_orbper', 
3: Orbital Period Upper Unc. [days]: 'pl_orbpererr1', 
4: Orbital Period Lower Unc. [days]: 'pl_orbpererr2', 
5: Orbital Period Limit Flag: 'pl_orbperlim', 
6: Planet Radius [Earth Radius]: 'pl_rade', 
7: Planet Radius Upper Unc. [Earth Radius]: 'pl_radeerr1', 
8: Planet Radius Lower Unc. [Earth Radius]: 'pl_radeerr2', 
9: Planet Radius Limit Flag: 'pl_radelim', 
10: RA [sexagesimal]: 'rastr', 
11: RA [deg]: 'ra', 
12: Dec [sexagesimal]: 'decstr', 
13: Dec [deg]:'dec', 
14: Distance [pc]: 'sy_dist', 
15: Distance [pc] Upper Unc: 'sy_disterr1', 
16: Distance [pc] Lower Unc: 'sy_disterr2', 
17: Parallax [mas]: 'sy_plx', 
18: Parallax [mas] Upper Unc: 'sy_plxerr1', 
19: Parallax [mas] Lower Unc: 'sy_plxerr2', 
20: V (Johnson) Magnitude: 'sy_vmag', 
21: V (Johnson) Magnitude Upper Unc: 'sy_vmagerr1', 
22: V (Johnson) Magnitude Lower Unc: 'sy_vmagerr2', 
23: Ks (2MASS) Magnitude: 'sy_kmag', 
24: Ks (2MASS) Magnitude Upper Unc: 'sy_kmagerr1', 
25: Ks (2MASS) Magnitude Lower Unc: 'sy_kmagerr2', 
26: Gaia Magnitude: 'sy_gaiamag', 
27: Gaia Magnitude Upper Unc: 'sy_gaiamagerr1', 
28: Gaia Magnitude Lower Unc: 'sy_gaiamagerr2', 
29: Date of Last Update: 'rowupdate', 
30: Release Date: 'releasedate'
"""
