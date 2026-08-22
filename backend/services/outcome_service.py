from datetime import date, datetime
from typing import Optional

def evaluate_intent_outcome(scheduled_date: Optional[date], delivered_at: datetime) -> str:
    """
    Evaluates if the order met its promised delivery date.
    Returns: 'fulfilled', 'missed', or 'unknown'
    """
    if not scheduled_date:
        return 'unknown'
        
    if delivered_at.date() <= scheduled_date:
        return 'fulfilled'
    else:
        return 'missed'
