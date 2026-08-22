from unittest.mock import patch
from services.history_service import log_history

def test_log_history_swallows_exceptions():
    with patch("services.history_service.supabase") as mock_supabase:
        # Make the execute() call raise an exception
        mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("Supabase Error")
        
        try:
            log_history(
                order_id="123e4567-e89b-12d3-a456-426614174000",
                change_type="created",
                summary="Order created"
            )
        except Exception as e:
            import pytest
            pytest.fail(f"log_history raised an exception: {e}")
