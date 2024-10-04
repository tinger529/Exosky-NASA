import data_api

# Current implementation is for testing only

def main():
    
    # Example usage of the data_api module
    ra = 20, dec = 0
    stars = data_api.get_skyview_from_earth(ra, dec)

    for i in range(len(stars["x"])):
        print(f"Star {stars["name"][i]}: x={stars["x"][i]}, y={stars["y"][i]}, distance={stars["distance"][i]}")

if __name__ == "__main__":
    main()