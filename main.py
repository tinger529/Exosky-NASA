import data_api

# Current implementation is for testing only

def main():
    
    # Example usage of the data_api module
    ra = 0
    dec = 0
    stars = data_api.get_nearby_stars(ra, dec)
    
    name = stars["name"]
    x = stars["x"]
    y = stars["y"]
    size = stars["size"]
    distance = stars["distance"]

    for i in range(len(x)):
        print(f"Star {name[i]}: x={x[i]}, y={y[i]}, distance={distance[i]}")

if __name__ == "__main__":
    main()