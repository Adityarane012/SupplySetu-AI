from datetime import date
from unittest.mock import patch
from routers.simulator import _sanitise_delivery_date

@patch("routers.simulator.today_ist")
def test_sanitise_delivery_date(mock_today):
    # Fixed today date
    mock_today.return_value = date(2026, 8, 22)
    
    # "kal"/"tomorrow" -> tomorrow
    assert _sanitise_delivery_date("kal") == "2026-08-23"
    assert _sanitise_delivery_date("tomorrow") == "2026-08-23"
    
    # "aaj" / "today" -> today
    assert _sanitise_delivery_date("aaj") == "2026-08-22"
    assert _sanitise_delivery_date("today") == "2026-08-22"
    
    # A valid future date -> itself
    assert _sanitise_delivery_date("2026-08-25") == "2026-08-25"
    
    # A past ISO date -> today
    assert _sanitise_delivery_date("2020-01-01") == "2026-08-22"
    
    # Garbage -> None
    assert _sanitise_delivery_date("garbage") is None
    assert _sanitise_delivery_date("") is None
    assert _sanitise_delivery_date(None) is None
