from services.route_optimizer import solve_tsp

def test_solve_tsp():
    distance_matrix = [
        [0, 10, 15, 20],
        [10, 0, 35, 25],
        [15, 35, 0, 30],
        [20, 25, 30, 0],
    ]
    
    result = solve_tsp(distance_matrix)
    
    route = result.get("route_indices", [])
    
    # starts and ends at depot index 0
    assert route[0] == 0
    assert route[-1] == 0
    
    # visits every node exactly once (excluding the return to 0)
    assert set(route[:-1]) == {0, 1, 2, 3}
    assert len(route) == 5
    
    # the optimal TSP distance for this matrix:
    # 0 -> 1 (10) -> 3 (25) -> 2 (30) -> 0 (15) = 80
    assert result["total_distance_m"] == 80
