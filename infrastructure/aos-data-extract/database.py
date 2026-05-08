import sqlite3
import json
import os

# All imports at the top
# Functions < 50 lines
# File < 500 lines

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bdo_pvp_helper.db")


def get_db_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Table for scoreboard sessions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scoreboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            raw_data TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

def save_scoreboard(user_id, data):
    """Saves a scoreboard session to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO scoreboards (user_id, raw_data) VALUES (?, ?)",
        (user_id, json.dumps(data))
    )
    
    scoreboard_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return scoreboard_id

def get_user_scoreboards(user_id):
    """Retrieves all scoreboards for a specific user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM scoreboards WHERE user_id = ? ORDER BY timestamp DESC", (user_id,))
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "user_id": row["user_id"],
            "timestamp": row["timestamp"],
            "data": json.loads(row["raw_data"])
        })
    
def search_player_matches(player_name):
    """Searches for matches containing a specific player name in the raw_data."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Use LIKE to search within the JSON string for the name
    # We look for "name": "player_name" pattern to be more precise
    search_pattern = f'%"name": "{player_name}"%'
    cursor.execute("SELECT * FROM scoreboards WHERE raw_data LIKE ? ORDER BY timestamp DESC", (search_pattern,))
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "user_id": row["user_id"],
            "timestamp": row["timestamp"],
            "data": json.loads(row["raw_data"])
        })
    
    conn.close()
    return results


if __name__ == "__main__":
    init_db()
    print("Database initialized at", os.path.abspath(DB_PATH))
