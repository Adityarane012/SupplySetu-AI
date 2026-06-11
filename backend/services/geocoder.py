from geopy.geocoders import Nominatim
from geopy.distance import geodesic

_geolocator = Nominatim(user_agent="supplysetu-ai-v1")


def geocode_address(address: str) -> dict | None:
    try:
        location = _geolocator.geocode(address + ", India", timeout=10)
        if location:
            return {"lat": location.latitude, "lng": location.longitude}
    except Exception as e:
        print(f"[Geocoder] Error geocoding '{address}': {e}")
    return None


def build_distance_matrix(locations: list[dict]) -> list[list[int]]:
    """
    locations = [{"lat": float, "lng": float}, ...]
    Returns: N x N matrix of distances in meters (integers)
    """
    n = len(locations)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                dist = geodesic(
                    (locations[i]["lat"], locations[i]["lng"]),
                    (locations[j]["lat"], locations[j]["lng"]),
                ).meters
                matrix[i][j] = int(dist)
    return matrix
