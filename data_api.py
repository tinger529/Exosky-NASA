from astroquery.gaia import Gaia
from astropy.coordinates import SkyCoord
import astropy.units as u
import numpy as np    
import matplotlib.pyplot as plt  

# Data api for accessing gaia data from NASA
# Api official documentation and examples: https://astroquery.readthedocs.io/en/latest/gaia/gaia.html
# https://gea.esac.esa.int/archive/documentation/GDR2/Gaia_archive/chap_datamodel/sec_dm_main_tables/ssec_dm_gaia_source.html


'''
Switch to cartesian coordinate system and project to 2D.
Args:
    ra_deg: right ascension in degrees
    dec_deg: declination in degrees
Returns:
    x_prime: x coordinate in 2D
    y_prime: y coordinate in 2D
'''
def ra_dec_to_xy(ra_deg, dec_deg):
    ra = np.radians(ra_deg)
    dec = np.radians(dec_deg)

    # Convert to 3D Cartesian coordinates
    x = np.cos(dec) * np.cos(ra)
    y = np.cos(dec) * np.sin(ra)
    z = np.sin(dec)

    # Stereographic projection to 2D coordinates
    x_prime = x / (1 - z)
    y_prime = y / (1 - z)
    
    return x_prime, y_prime


'''
Switch to cartesian coordinate system and remain in 3D.
Args:
    ra_deg: right ascension in degrees
    dec_deg: declination in degrees
    dis: distance in parsecs
Returns:
    x: x coordinate in 3D
    y: y coordinate in 3D
    z: z coordinate in 3D
'''
def ra_dec_to_xyz(ra_deg, dec_deg, dis):
    ra = np.radians(ra_deg)
    dec = np.radians(dec_deg)

    # Convert to 3D Cartesian coordinates
    x = dis * np.cos(dec) * np.cos(ra)
    y = dis * np.cos(dec) * np.sin(ra)
    z = dis * np.sin(dec)
    
    return x, y, z
    

def _get_relative_pos(source_ra, source_dec, source_dis, target_ra, target_dec, target_dis):
    
    source_x, source_y, source_z = ra_dec_to_xyz(source_ra, source_dec, source_dis)
    target_x, target_y, target_z = ra_dec_to_xyz(target_ra, target_dec, target_dis)
    
    # Calculate the relative position of the target star
    relative_x = target_x - source_x
    relative_y = target_y - source_y
    relative_z = target_z - source_z

    return relative_x, relative_y, relative_z

'''
Return stars' positional information, observed from the earth.
Args:
    ra: right ascension in degrees
    dec: declination in degrees
    fovy_w: field of view width in degrees
    fovy_h: field of view height in degrees
Returns:
    data_dict: dictionary containing stars' positional information
        "name": star names (Gaia designation)
        "x": x coordinates in 2D
        "y": y coordinates in 2D
        "ra": right ascension in degrees
        "dec": declination in degrees
        "size": star size
        "brightness": star brightness
        "distance": star distance from the earth
'''
def get_skyview_from_earth(ra, dec, fovy_w=1, fovy_h=1):
    coord = SkyCoord(ra=ra, dec=dec, unit=(u.degree, u.degree), frame='icrs')
    width = u.Quantity(fovy_w, u.deg)
    height = u.Quantity(fovy_h, u.deg)

    # Get the star data from Gaia
    r = Gaia.query_object_async(coordinate=coord, width=width, height=height)

    name = r['DESIGNATION']
    ra_values = r['ra']
    dec_values = r['dec']
    distance = r['dist']     
    mag_values = r['phot_g_mean_mag']       

    x_vals, y_vals = ra_dec_to_xy(ra_values, dec_values)

    # Size proxy (lower magnitude = brighter)
    size_normalized = (np.max(mag_values) - mag_values) / (np.max(mag_values) - np.min(mag_values)) * 20 # Scale to 20

    # only extract useful data
    data_dict = {
        "name": name,
        "x": x_vals,
        "y": y_vals,
        "ra": ra_values,
        "dec": dec_values,
        "size": size_normalized,
        "brightness": mag_values,
        "distance": distance
    }

    return data_dict
    

'''
Return stars' positional information, observed from the exoplanet.
Args:
    ex_ra: exoplanet's right ascension in degrees
    ex_dec: exoplanet's declination in degrees
    ra: right ascension in degrees
    dec: declination in degrees
    fovy_w: field of view width in degrees
    fovy_h: field of view height in degrees
Returns:
    data_dict: dictionary containing stars' positional information
        "name": star names (Gaia designation)
        "x": x coordinates in 2D
        "y": y coordinates in 2D
        "ra": right ascension in degrees
        "dec": declination in degrees
        "size": star size
        "brightness": star brightness
        "distance": star distance from the earth
'''
def get_skyview_from_exoplanet(ex_ra, ex_dec, ra, dec, fovy_w=1, fovy_h=1):
    # TODO: Implement this function
    raise NotImplementedError("This function is not implemented yet")
        


    
