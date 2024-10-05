from astroquery.gaia import Gaia
from astropy.coordinates import SkyCoord
import astropy.units as u
import numpy as np
import math

# Data api for accessing gaia data from NASA
# Api official documentation and examples: https://astroquery.readthedocs.io/en/latest/gaia/gaia.html
# https://gea.esac.esa.int/archive/documentation/GDR2/Gaia_archive/chap_datamodel/sec_dm_main_tables/ssec_dm_gaia_source.html



'''
Return stars' positional information, observed from the exoplanet.
Args:
    ex_ra: exoplanet's right ascension in degrees
    ex_dec: exoplanet's declination in degrees
    ex_distance: exoplanet's distance in parsecs
    ra: observed right ascension in degrees
    dec: observed declination in degrees
    fovy_w: field of view width in degrees
    fovy_h: field of view height in degrees
Returns:
    data_dict: dictionary containing stars' positional information
        "name": star names (Gaia designation)
        "ra": right ascension in degrees
        "dec": declination in degrees
        "size": star size
        "brightness": star brightness
        "distance": star distance from the earth
'''
def get_skyview_from_exoplanet(ex_ra, ex_dec, ex_distance, ra, dec, fovy_w=30, fovy_h=30, n_stars=150):
    # get view approximation from earth
    proxy_ra, proxy_dec = view_transform(ex_ra, ex_dec, ra, dec, ex_distance)

    ra_min = proxy_ra - fovy_w / 2
    ra_max = proxy_ra + fovy_w / 2
    dec_min = proxy_dec - fovy_h / 2
    dec_max = proxy_dec + fovy_h / 2

    ra_distance = math.sqrt(ex_distance**2 + 10000 - 2 * ex_distance * math.cos(math.pi-math.radians(ra)))
    distance_limit = math.sqrt(ra_distance**2 + 10000 - 2 * ra_distance * math.cos(math.pi-math.radians(dec)))
    parallax_limit = 1000 / distance_limit
    # print("distance limit: ", distance_limit)
    # print("parallax limit: ", parallax_limit)

    # Get the star data from Gaia #TODO: change parallax limit
    query2 = f"""
            SELECT 
            TOP {n_stars}
            source_id, DESIGNATION, ra, dec, parallax, phot_g_mean_mag,
            phot_bp_mean_mag, phot_rp_mean_mag
            FROM gaiadr2.gaia_source
            WHERE parallax > {parallax_limit}
            AND ra BETWEEN {ra_min} AND {ra_max}
            AND dec BETWEEN {dec_min} AND {dec_max}
            """
    r = Gaia.launch_job(query2).get_results()

    l = len(r[['ra']])
    name = r['DESIGNATION']
    ra_values = r['ra']
    dec_values = r['dec']
    parallex_values = r['parallax']
    distance = 1000 / parallex_values    
    mag_values = r['phot_g_mean_mag']  
    bv_colors = []
    ra_mean = np.mean(ra_values)
    dec_mean = np.mean(dec_values)
    bp_mag = r['phot_bp_mean_mag']
    rp_mag = r['phot_rp_mean_mag']
    
    
    # calculate relative position of the stars from the exoplanet
    for i in range(l):
        x, y, z = get_relative_pos(ex_ra, ex_dec, ex_distance, ra_values[i], dec_values[i], distance[i])
        distance[i] = math.sqrt(x**2 + y**2 + z**2)
        ra_values[i] = ra + ra_values[i] - ra_mean
        dec_values[i] = dec + dec_values[i] - dec_mean
        # ra_values[i], dec_values[i] = xyz_to_ra_dec(x, y, z)
        # print(ra_values[i], dec_values[i], distance[i])
        
        bm = bp_mag[i]
        rm = rp_mag[i]
        # Calculate an approximate B-V color index
        bv_color_index = 0.751 * (bm - rm)
        bv_colors.append(bv_color_index)

    # Size proxy (lower magnitude = brighter)
    size_normalized = (np.max(mag_values) - mag_values) / (np.max(mag_values) - np.min(mag_values)) * 20 # Scale to 20
    
    # only extract useful data
    data_dict = {
        "name": name.tolist(),
        "ra": ra_values.tolist(),
        "dec": dec_values.tolist(),
        "size": size_normalized.tolist(),
        "brightness": mag_values.tolist(),
        "bv": bv_colors,
        "distance": distance.tolist(),
        "parallax": parallex_values.tolist()
    }
    
    return data_dict


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
    parallex_values = r['parallax']

    # Size proxy (lower magnitude = brighter)
    size_normalized = (np.max(mag_values) - mag_values) / (np.max(mag_values) - np.min(mag_values)) * 20 # Scale to 20

    # only extract useful data
    data_dict = {
        "name": name,
        "ra": ra_values,
        "dec": dec_values,
        "size": size_normalized,
        "brightness": mag_values,
        "distance": distance,
        "parallax": parallex_values
    }

    return data_dict
    


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


def ra_dec_to_xyz(ra_deg, dec_deg, dis):
    ra = np.radians(ra_deg)
    dec = np.radians(dec_deg)

    # Convert to 3D Cartesian coordinates
    x = np.cos(dec) * np.cos(ra) * dis
    y = np.cos(dec) * np.sin(ra) * dis
    z = np.sin(dec) * dis
    
    return x, y, z

def xyz_to_ra_dec(x, y, z):
    r = np.sqrt(x**2 + y**2 + z**2)
    dec = np.arcsin(z / r)
    ra = np.arctan2(y, x)
    
    # Convert RA and Dec from radians to degrees
    ra_deg = (np.degrees(ra)) % 360
    dec_deg = np.degrees(dec)
    
    return ra_deg, dec_deg
    

'''
Calculate the relative position of the target star from the source star and project to 2D.
Args:
    source_ra: source star's right ascension in degrees
    source_dec: source star's declination in degrees
    source_dis: source star's distance in parsecs
    target_ra: target star's right ascension in degrees
    target_dec: target star's declination in degrees
    target_dis: target star's distance in parsecs
Returns:
    relative_x: relative x coordinate in 2D
    relative_y: relative y coordinate in 2D
'''
def get_relative_pos(source_ra, source_dec, source_dis, target_ra, target_dec, target_dis):

    # print("source: ", source_ra, source_dec, source_dis)
    # print("target: ", target_ra, target_dec, target_dis)
    
    source_x, source_y, source_z = ra_dec_to_xyz(source_ra, source_dec, source_dis)
    target_x, target_y, target_z = ra_dec_to_xyz(target_ra, target_dec, target_dis)
    
    # Calculate the relative position of the target star
    relative_z = target_z - source_z
    relative_x = target_x - source_x
    relative_y = target_y - source_y

    return relative_x, relative_y, relative_z

'''
Transform the view from the exoplanet to the earth approximation view.
Args:
    ex_ra: exoplanet's right ascension in degrees
    ex_dec: exoplanet's declination in degrees
    ra: view right ascension in degrees
    dec: view declination in degrees
Returns:
    ret_ra: transformed right ascension in degrees
    ret_dec: transformed declination in degrees
'''
def view_transform(ex_ra, ex_dec, ra, dec, ex_distance):
    sign_ra, sign_dec = 1, 1

    # check viewing angle
    # print("exoplanet position: ", ex_ra, ex_dec)
    # print("viewing angle before transform: ", ra, dec)

    # change angle range for easy calculation
    if ra > 180:
        ra = 360 - ra
        sign_ra = -1

    # start transformation
    ra_dis = math.sqrt(ex_distance**2 + 10000 - 200 * ex_distance * math.cos(math.pi-math.radians(ra)))
    dec_dis = math.sqrt(ex_distance**2 + 10000 - 200 * ex_distance * math.cos(math.pi-math.radians(dec)))
    ra_change = math.asin(math.sin(math.pi-math.radians(ra)) / ra_dis * 100)
    ra_change = math.degrees(ra_change)
    dec_change = math.asin(math.sin(math.pi-math.radians(dec)) / dec_dis * 100)
    dec_change = math.degrees(dec_change)
    ret_ra = ex_ra + ra_change * sign_ra
    ret_dec = ex_dec + dec_change * sign_dec

    # print("viewing angle after transform: ", ret_ra, ret_dec)
    return ret_ra, ret_dec
    
