from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
import json
import pandas as pd
import csv
import os

exoplanet_list = []
router = APIRouter()

class Exoplanet:
    def __init__(self, pl_name, hostname, pl_orbper, sy_dist) -> None:
        self.pl_name = pl_name
        self.hostname = hostname
        self.pl_orbper = pl_orbper
        self.sy_dist = sy_dist
        
    def to_dict(self):
        return {
            "pl_name": self.pl_name,
            "hostname": self.hostname,
            "pl_orbper": self.pl_orbper,
            "sy_dist": self.sy_dist
        }

@router.get("/all")
async def get_exoplanet_list():
    """
    Retrieve exoplanet list.
    Example: /exoplanet/all
    """
    global exoplanet_list
    
    if not exoplanet_list:
        get_exoplanet_dict()
        
    exoplanet_dict = [exoplanet.to_dict() for exoplanet in exoplanet_list]
    response_data = json.dumps({"exoplanets": exoplanet_dict})
                    
    return JSONResponse(status_code=200, content=response_data)


def get_exoplanet_dict():
    """
    Initialize global variable (sample_data, i.e. Exoplanet collection) 
    """
    
    file_path = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "../static/Exoplanet.csv")

    global exoplanet_list

    with open(file_path, 'r') as file:
        reader = csv.reader(file)

        for row in reader:
            # Skip columns comment and first row (title)
            if not row[0].startswith('#') and row[0] != "pl_name":
                exoplanet_list.append(Exoplanet(
                    row[0], row[1], row[2], row[14],
                ))
                
"""
Indices

>> 0: Planet Name: 'pl_name', 
>> 1: Host Name: 'hostname', 
>> 2: Orbital Period [days]: 'pl_orbper', 
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
>> 14: Distance [pc]: 'sy_dist', 
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
