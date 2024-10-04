from fastapi import APIRouter, HTTPException
from astroquery.image_cutouts.first import First
from astropy import coordinates
from astropy import units as u
import matplotlib.pyplot as plt
from astropy.visualization import simple_norm
from io import BytesIO
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.get("/generate/")
async def generate_image(ra: float, dec: float):
    """
    Generate an image based on given Right Ascension (ra) and Declination (dec).
    Example query: /image/generate/?ra=162.530&dec=30.677
    """
    try:
        # Get the image data
        coord = coordinates.SkyCoord(ra*u.deg, dec*u.deg, frame='icrs')
        images = First.get_images(coord)

        if len(images) == 0:
            raise HTTPException(status_code=404, detail="No images found for these coordinates.")
        
        # Extract the image data from the first HDU
        image_data = images[0].data
        
        # Figure the image
        fig, ax = plt.subplots()
        
        # Normalize and plot the image
        norm = simple_norm(image_data, 'sqrt')
        ax.imshow(image_data, norm=norm, cmap='gray')
        ax.set_title(f'RA: {ra}, DEC: {dec}')
        plt.colorbar(ax.imshow(image_data, norm=norm, cmap='gray'), ax=ax)

        buf = BytesIO()
        
        # Save the image as a PNG file
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()

        return StreamingResponse(buf, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))