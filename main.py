import test

# Current implementation is for testing only

def main():
    
    # Example usage of the data_api module
    test.test_view_from_earth(print_result=False, show_plot=True)
    test.test_view_from_exoplanet(print_result=False, show_plot=True)
    print("All tests completed.")

if __name__ == "__main__":
    main()