import os
from datetime import datetime, timezone, timedelta, date

# Get timezone offset from environment, default to IST (UTC+5:30) which is 5.5 hours
offset_hours = float(os.getenv("TIMEZONE_OFFSET_HOURS", "5.5"))
IST = timezone(timedelta(hours=offset_hours))

def now_ist() -> datetime:
    """Returns the current datetime in the configured timezone."""
    return datetime.now(IST)

def today_ist() -> date:
    """Returns the current date in the configured timezone."""
    return now_ist().date()
