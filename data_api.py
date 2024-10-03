from astroquery.gaia import Gaia
from astropy.coordinates import SkyCoord
import astropy.units as u
import numpy as np      

# Data api for accessing gaia data from NASA
# Api official documentation and examples: https://astroquery.readthedocs.io/en/latest/gaia/gaia.html

# Store current stars data
buffer = dict()

'''
Switch coordinate system
Args:
    ra_deg: right ascension in degrees
    dec_deg: declination in degrees
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
Return stars' positional information in Cartesian coordinates.
Args:
    ra: right ascension in degrees
    dec: declination in degrees
    fovy_w: field of view width in degrees
    fovy_h: field of view height in degrees
    n_stars: number of stars to return
'''
def get_nearby_stars(ra, dec, fovy_w=1, fovy_h=1, n_stars=100):
    coord = SkyCoord(ra=ra, dec=dec, unit=(u.degree, u.degree), frame='icrs')
    width = u.Quantity(fovy_w, u.deg)
    height = u.Quantity(fovy_h, u.deg)

    # Get the star data from Gaia
    job = Gaia.launch_job_async(f"select top {n_stars} designation,ra,dec,parallax,phot_g_mean_mag "
                                "from gaiadr3.gaia_source order by source_id")
    r = job.get_results()

    ra_values = r['ra']
    dec_values = r['dec']
    parallax_values = r['parallax']         # Distance proxy (higher parallax = closer)
    mag_values = r['phot_g_mean_mag']       # Size proxy (lower magnitude = brighter)

    x_vals, y_vals = ra_dec_to_xy(ra_values, dec_values)
    parallax_normalized = (parallax_values - np.min(parallax_values)) / (np.max(parallax_values) - np.min(parallax_values))
    size_normalized = (np.max(mag_values) - mag_values) / (np.max(mag_values) - np.min(mag_values)) * 20 # Scale to 20

    data_dict = {
        "x": x_vals,
        "y": y_vals,
        "size": size_normalized,
        "color": parallax_normalized
    }

    buffer = data_dict.copy()

    return data_dict


