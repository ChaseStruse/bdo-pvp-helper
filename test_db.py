from backend.aos.database import get_pending_scoreboards
try:
    print(get_pending_scoreboards())
except Exception as e:
    print("Error:", e)
