import data_api
import matplotlib.pyplot as plt 

def test_view_from_earth(print_result=True, show_plot=False):
    print("Test view from earth")
    # Test case 1
    ra, dec = 20, 20
    star_info = data_api.get_skyview_from_earth(ra, dec)
    if print_result:
        print("Test case 1:")
        print("ra:", ra, ", dec:", dec)
        print("star_info:")
        for i in range(len(star_info["name"])):
            print(star_info["name"][i], star_info["ra"][i], star_info["dec"][i], star_info["distance"][i])
        print()
    if show_plot:
        plt.scatter(star_info["ra"], star_info["dec"], c=star_info["distance"], cmap='viridis')
        plt.xlabel("ra")
        plt.ylabel("dec")
        plt.colorbar(label="distance")
        plt.show()

    # Test case 2
    ra, dec = 40, 0
    star_info = data_api.get_skyview_from_earth(ra, dec)
    if print_result:
        print("Test case 2:")
        print("ra:", ra, ", dec:", dec)
        print("star_info:")
        for i in range(len(star_info["name"])):
            print(star_info["name"][i], star_info["ra"][i], star_info["dec"][i], star_info["distance"][i])
        print()
    if show_plot:
        plt.scatter(star_info["ra"], star_info["dec"], c=star_info["distance"], cmap='viridis')
        plt.xlabel("ra")
        plt.ylabel("dec")
        plt.colorbar(label="distance")
        plt.show()


def test_view_from_exoplanet(print_result=True, show_plot=False):
    # Test case 1
    ra, dec = 20, 20
    exo_ra, exo_dec = 90, -20
    exo_distance = 0.9
    star_info = data_api.get_skyview_from_exoplanet(exo_ra, exo_dec, exo_distance, ra, dec)
    if print_result:
        print("Test case 1:")
        print("ra:", ra, ", dec:", dec)
        print("star_info:")
        for i in range(len(star_info["name"])):
            print(star_info["name"][i], star_info["ra"][i], star_info["dec"][i], star_info["distance"][i])
        print()
    if show_plot:
        plt.scatter(star_info["x"], star_info["y"], c=star_info["distance"], cmap='viridis')
        plt.xlabel("x")
        plt.ylabel("y")
        plt.colorbar(label="distance")
        plt.show()

    # Test case 2
    ra, dec = 40, -20
    exo_ra, exo_dec = 30, 30
    exo_distance = 1.0
    star_info = data_api.get_skyview_from_exoplanet(exo_ra, exo_dec, exo_distance, ra, dec)
    if print_result:
        print("Test case 2:")
        print("ra:", ra, ", dec:", dec)
        print("star_info:")
        for i in range(len(star_info["name"])):
            print(star_info["name"][i], star_info["ra"][i], star_info["dec"][i], star_info["distance"][i])
        print()
    if show_plot:
        plt.scatter(star_info["x"], star_info["y"], c=star_info["distance"], cmap='viridis')
        plt.xlabel("x")
        plt.ylabel("y")
        plt.colorbar(label="distance")
        plt.show()