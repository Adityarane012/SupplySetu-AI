from ortools.constraint_solver import routing_enums_pb2, pywrapcp


def solve_tsp(distance_matrix: list[list[int]]) -> dict:
    """
    Solves the Travelling Salesman Problem using OR-Tools.
    Node 0 is always the depot.

    Returns:
        {
            "route_indices": [0, 2, 1, 3, 0],  # depot → stops → depot
            "total_distance_m": 12345
        }
    """
    n = len(distance_matrix)

    if n <= 1:
        return {"route_indices": [0, 0], "total_distance_m": 0}

    manager = pywrapcp.RoutingIndexManager(n, 1, 0)  # nodes, vehicles, depot
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_idx, to_idx):
        from_node = manager.IndexToNode(from_idx)
        to_node = manager.IndexToNode(to_idx)
        return distance_matrix[from_node][to_node]

    transit_idx = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_idx)

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = 5

    solution = routing.SolveWithParameters(search_params)

    if not solution:
        # Fallback: naive sequential route
        return {
            "route_indices": list(range(n)) + [0],
            "total_distance_m": 0,
        }

    route = []
    total_dist = 0
    index = routing.Start(0)
    while not routing.IsEnd(index):
        route.append(manager.IndexToNode(index))
        prev_idx = index
        index = solution.Value(routing.NextVar(index))
        total_dist += routing.GetArcCostForVehicle(prev_idx, index, 0)
    route.append(0)  # return to depot

    return {"route_indices": route, "total_distance_m": total_dist}
