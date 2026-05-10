import sqlite3
import json
import os
from collections import Counter
from werkzeug.security import generate_password_hash, check_password_hash

# All imports at the top
# Functions < 50 lines
# File < 500 lines

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bdo_pvp_helper.db")

STAT_KEYS = ["Kills", "Deaths", "CC", "Dealt", "Taken", "Healed"]


def get_db_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes the database schema and applies any pending migrations."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scoreboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            raw_data TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            family_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_admin INTEGER DEFAULT 0
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            guide_path TEXT NOT NULL,
            guide_title TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, guide_path),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    # Migration: add won column if it doesn't exist yet
    try:
        cursor.execute("ALTER TABLE scoreboards ADD COLUMN won INTEGER DEFAULT NULL")
    except sqlite3.OperationalError:
        pass

    # Migration: add is_approved column to scoreboards
    try:
        cursor.execute("ALTER TABLE scoreboards ADD COLUMN is_approved INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        pass

    # Migration: add image_path column to scoreboards
    try:
        cursor.execute("ALTER TABLE scoreboards ADD COLUMN image_path TEXT DEFAULT NULL")
    except sqlite3.OperationalError:
        pass

    # Migration: add is_admin column to users if missing
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    # Migration: add is_approved column to users if missing (existing users are approved by default)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()


def create_user(email, password, family_name, is_admin=0):
    """Creates a new user account. Raises ValueError if email is already taken. New non-admin users require approval."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # Admins are auto-approved, normal users are not
    is_approved = 1 if is_admin else 0
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, family_name, is_admin, is_approved) VALUES (?, ?, ?, ?, ?)",
            (email.lower().strip(), generate_password_hash(password), family_name.strip(), int(is_admin), is_approved)
        )
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        raise ValueError("Email already registered")
    finally:
        conn.close()


def get_user_by_family_name(family_name):
    """Returns the user row dict for the given family name, or None."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # Case insensitive lookup for family name
    cursor.execute("SELECT * FROM users WHERE family_name = ? COLLATE NOCASE", (family_name.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def verify_user(family_name, password):
    """Returns the user dict if credentials are valid. Raises ValueError if not approved."""
    user = get_user_by_family_name(family_name)
    if user and check_password_hash(user["password_hash"], password):
        if not user.get("is_approved", 1):
            raise ValueError("Account pending admin approval.")
        return user
    return None


def get_pending_users():
    """Returns all users waiting for admin approval."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, email, family_name, created_at FROM users WHERE is_approved = 0 ORDER BY created_at ASC"
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def approve_user(user_id):
    """Approves a pending user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_approved = 1 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()


def deny_user(user_id):
    """Deletes a pending user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ? AND is_approved = 0", (user_id,))
    conn.commit()
    conn.close()


def get_all_users():
    """Returns all registered approved users (admin use only)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, email, family_name, is_admin, created_at FROM users WHERE is_approved = 1 ORDER BY created_at DESC"
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def get_db_stats():
    """Returns aggregate site statistics for the admin dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as c FROM users")
    total_users = cursor.fetchone()["c"]
    cursor.execute("SELECT COUNT(*) as c FROM scoreboards")
    total_matches = cursor.fetchone()["c"]
    cursor.execute("SELECT COUNT(*) as c FROM scoreboards WHERE won IS NOT NULL")
    matches_with_result = cursor.fetchone()["c"]
    cursor.execute("SELECT COUNT(*) as c FROM scoreboards WHERE won = 1")
    wins_logged = cursor.fetchone()["c"]
    conn.close()
    return {
        "total_users": total_users,
        "total_matches": total_matches,
        "matches_with_result": matches_with_result,
        "wins_logged": wins_logged,
    }


def is_user_admin(family_name):
    """Returns True if the given family_name belongs to an admin user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT is_admin FROM users WHERE family_name = ?", (family_name,))
    row = cursor.fetchone()
    conn.close()
    return bool(row and row["is_admin"])


def get_bookmarks(user_id):
    """Returns a list of bookmarked guides for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, guide_path, guide_title, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def add_bookmark(user_id, guide_path, guide_title):
    """Adds a new bookmark for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO bookmarks (user_id, guide_path, guide_title) VALUES (?, ?, ?)",
            (user_id, guide_path, guide_title)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # Already bookmarked
    finally:
        conn.close()


def remove_bookmark(user_id, guide_path):
    """Removes a bookmark for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bookmarks WHERE user_id = ? AND guide_path = ?", (user_id, guide_path))
    conn.commit()
    conn.close()


def save_scoreboard(user_id, data, won=None, image_path=None, is_approved=1):
    """Saves a scoreboard session to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO scoreboards (user_id, raw_data, won, image_path, is_approved) VALUES (?, ?, ?, ?, ?)",
        (user_id, json.dumps(data), won, image_path, is_approved)
    )

    scoreboard_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return scoreboard_id


def get_pending_scoreboards():
    """Retrieves all pending scoreboards requiring admin approval."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, user_id, timestamp, raw_data, won, image_path FROM scoreboards WHERE is_approved = 0 ORDER BY timestamp ASC"
    )
    rows = cursor.fetchall()
    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "user_id": row["user_id"],
            "timestamp": row["timestamp"],
            "won": row["won"],
            "image_path": row["image_path"],
            "data": json.loads(row["raw_data"])
        })
    conn.close()
    return results


def approve_scoreboard(scoreboard_id):
    """Approves a pending scoreboard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE scoreboards SET is_approved = 1 WHERE id = ?", (scoreboard_id,))
    conn.commit()
    conn.close()


def deny_scoreboard(scoreboard_id):
    """Deletes a pending scoreboard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scoreboards WHERE id = ? AND is_approved = 0", (scoreboard_id,))
    conn.commit()
    conn.close()


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
            "is_approved": row["is_approved"],
            "data": json.loads(row["raw_data"])
        })

    conn.close()
    return results


def _find_player_in_match(data, player_name):
    """Returns the player's stat dict from a raw_data list, or None."""
    for player in data:
        if player.get("name") == player_name:
            return player
    return None


def get_player_profile(player_name):
    """Builds a full player profile from all scoreboards containing that player."""
    conn = get_db_connection()
    cursor = conn.cursor()

    search_pattern = f'%"name": "{player_name}"%'
    cursor.execute(
        "SELECT * FROM scoreboards WHERE raw_data LIKE ? AND is_approved = 1 ORDER BY timestamp DESC",
        (search_pattern,)
    )
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return None

    stat_buckets = {k: [] for k in STAT_KEYS}
    class_counter = Counter()
    spec_counter = Counter()
    wins = losses = 0
    recent_matches = []

    for row in rows:
        data = json.loads(row["raw_data"])
        player = _find_player_in_match(data, player_name)
        if not player:
            continue

        for key in STAT_KEYS:
            val = player.get(key)
            if isinstance(val, (int, float)):
                stat_buckets[key].append(val)

        cls = player.get("selectedClass") or player.get("Class") or ""
        spec = player.get("selectedSpec") or player.get("Spec") or ""
        if cls:
            class_counter[cls] += 1
        if spec:
            spec_counter[spec] += 1

        # W/L: use team membership + match result (uploader's won flag)
        if row["won"] is not None:
            player_is_enemy = bool(player.get("Enemy", False))
            uploader_won = bool(row["won"])
            # Non-enemy players share the uploader's result; enemy team is the opposite
            player_won = (not player_is_enemy) == uploader_won
            if player_won:
                wins += 1
            else:
                losses += 1

        if len(recent_matches) < 3:
            recent_matches.append({
                "id": row["id"],
                "timestamp": row["timestamp"],
                "uploaded_by": row["user_id"],
                "won": bool(row["won"]) if row["won"] is not None else None,
                "player_stats": player,
                "all_players": data
            })

    n = len(stat_buckets["Kills"])
    totals = {k: sum(v) for k, v in stat_buckets.items()}
    averages = {k: round(sum(v) / len(v), 1) if v else 0 for k, v in stat_buckets.items()}

    tracked = wins + losses
    return {
        "name": player_name,
        "matches_played": n,
        "wins": wins,
        "losses": losses,
        "win_rate": round((wins / tracked) * 100, 1) if tracked > 0 else None,
        "main_class": class_counter.most_common(1)[0][0] if class_counter else "Unknown",
        "main_spec": spec_counter.most_common(1)[0][0] if spec_counter else "Unknown",
        "totals": totals,
        "averages": averages,
        "last_3_matches": recent_matches
    }


def search_player_matches(player_name):
    """Searches for matches containing a specific player name in the raw_data."""
    conn = get_db_connection()
    cursor = conn.cursor()

    search_pattern = f'%"name": "{player_name}"%'
    cursor.execute("SELECT * FROM scoreboards WHERE raw_data LIKE ? AND is_approved = 1 ORDER BY timestamp DESC", (search_pattern,))
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
