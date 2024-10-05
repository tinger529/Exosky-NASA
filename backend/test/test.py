from fastapi import APIRouter
from fastapi.responses import JSONResponse
from .test_data_api import *

router = APIRouter()

# Define your main function as a route in FastAPI
@router.get("/run-tests/")
async def run_tests():
    """
    Run test functions and return a summary.
    """
    try:
        test_view_from_earth(print_result=False, show_plot=True)
        test_view_from_exoplanet(print_result=False, show_plot=True)
        
        return JSONResponse(content={"message": "All tests completed successfully."})
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})