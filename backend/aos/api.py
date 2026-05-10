import os
import uuid
import tempfile
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from extractor import process_scoreboard
from database import (
    init_db, save_scoreboard, get_user_scoreboards,
    search_player_matches, get_player_profile,
    create_user, verify_user, is_user_admin,
    get_db_stats, get_all_users, get_user_by_family_name,
    get_bookmarks, add_bookmark, remove_bookmark,
    get_pending_users, approve_user, deny_user,
    get_pending_scoreboards, approve_scoreboard, deny_scoreboard
)

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Initialize database on startup
init_db()

app = Flask(__name__)
CORS(app)


def save_temp_file(file_storage):
    """Saves a FileStorage object to a temporary file and returns the path."""
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file_storage.filename)
    file_storage.save(temp_path)
    return temp_path


@app.route('/extract', methods=['POST'])
def extract_stats():
    """Endpoint to extract stats from an uploaded image."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Save permanently to uploads directory with a unique name
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        file.save(filepath)
        
        results = process_scoreboard(filepath)
        
        # We append image_path so the frontend can send it to /save
        # Use a relative URL path that our new route will serve
        image_path = f"/uploads/{filename}"
        
        return jsonify({
            "results": results,
            "image_path": image_path
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/save', methods=['POST'])
def save_data():
    """Endpoint to save extracted scoreboard data to the database."""
    req_data = request.get_json()

    user_id = req_data.get('user_id')
    data = req_data.get('data')
    won = req_data.get('won')  # True / False / None
    image_path = req_data.get('image_path')

    if not user_id or not data:
        return jsonify({"error": "Missing user_id or data"}), 400

    try:
        won_int = int(won) if won is not None else None
        is_admin = is_user_admin(user_id)
        is_approved = 1 if is_admin else 0
        
        scoreboard_id = save_scoreboard(user_id, data, won_int, image_path, is_approved)
        return jsonify({
            "status": "success", 
            "scoreboard_id": scoreboard_id,
            "is_approved": bool(is_approved)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/history/<user_id>', methods=['GET'])
def get_history(user_id):
    """Endpoint to retrieve history for a specific user."""
    try:
        history = get_user_scoreboards(user_id)
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/search', methods=['GET'])
def search_matches():
    """Endpoint to search for matches by player name."""
    name = request.args.get('name')
    if not name:
        return jsonify({"error": "Missing name parameter"}), 400
    try:
        matches = search_player_matches(name)
        return jsonify(matches)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/player/<player_name>', methods=['GET'])
def get_player(player_name):
    """Endpoint to retrieve a full player profile with aggregated stats."""
    try:
        profile = get_player_profile(player_name)
        if profile is None:
            return jsonify({"error": f"No data found for player '{player_name}'"}), 404
        return jsonify(profile)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/auth/register', methods=['POST'])
def register():
    """Creates a new user account."""
    data = request.get_json()
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''
    family_name = (data.get('family_name') or '').strip()

    if not email or not password or not family_name:
        return jsonify({'error': 'Email, password, and family name are required'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    try:
        user_id = create_user(email, password, family_name)
        return jsonify({'status': 'success', 'user_id': user_id}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/auth/login', methods=['POST'])
def login():
    """Validates credentials and returns the user record."""
    data = request.get_json()
    family_name = data.get('family_name') or ''
    password = data.get('password') or ''

    try:
        user = verify_user(family_name, password)
        if not user:
            return jsonify({'error': 'Invalid family name or password'}), 401

        return jsonify({
            'id': str(user['id']),
            'email': user['email'],
            'family_name': user['family_name'],
            'is_admin': bool(user['is_admin'])
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 403

@app.route('/auth/admin_status/<family_name>', methods=['GET'])
def admin_status(family_name):
    """Checks if a given family name has admin privileges."""
    is_admin = is_user_admin(family_name)
    return jsonify({'is_admin': is_admin})

@app.route('/admin/stats', methods=['GET'])
def admin_stats():
    """Returns database stats for the admin dashboard. Requires admin query param."""
    family_name = request.args.get('family_name')
    if not family_name or not is_user_admin(family_name):
        return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        stats = get_db_stats()
        users = get_all_users()
        pending_users = get_pending_users()
        pending_matches = get_pending_scoreboards()
        return jsonify({
            'stats': stats,
            'users': users,
            'pending_users': pending_users,
            'pending_matches': pending_matches
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/admin/users/<int:user_id>/approve', methods=['POST'])
def admin_approve_user(user_id):
    data = request.get_json()
    family_name = data.get('family_name')
    if not family_name or not is_user_admin(family_name):
        return jsonify({'error': 'Unauthorized'}), 403
    approve_user(user_id)
    return jsonify({'status': 'success'})


@app.route('/admin/users/<int:user_id>/deny', methods=['DELETE'])
def admin_deny_user(user_id):
    data = request.get_json()
    family_name = data.get('family_name')
    if not family_name or not is_user_admin(family_name):
        return jsonify({'error': 'Unauthorized'}), 403
    deny_user(user_id)
    return jsonify({'status': 'success'})


@app.route('/admin/matches/<int:match_id>/approve', methods=['POST'])
def admin_approve_match(match_id):
    data = request.get_json()
    family_name = data.get('family_name')
    if not family_name or not is_user_admin(family_name):
        return jsonify({'error': 'Unauthorized'}), 403
    approve_scoreboard(match_id)
    return jsonify({'status': 'success'})


@app.route('/admin/matches/<int:match_id>/deny', methods=['DELETE'])
def admin_deny_match(match_id):
    data = request.get_json()
    family_name = data.get('family_name')
    if not family_name or not is_user_admin(family_name):
        return jsonify({'error': 'Unauthorized'}), 403
    deny_scoreboard(match_id)
    return jsonify({'status': 'success'})


@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(UPLOADS_DIR, filename)


@app.route('/bookmarks', methods=['GET'])
def get_user_bookmarks():
    family_name = request.args.get('family_name')
    if not family_name:
        return jsonify({'error': 'family_name is required'}), 400
    user = get_user_by_family_name(family_name)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    bookmarks = get_bookmarks(user['id'])
    return jsonify(bookmarks)


@app.route('/bookmarks', methods=['POST'])
def create_bookmark():
    data = request.get_json()
    family_name = data.get('family_name')
    guide_path = data.get('guide_path')
    guide_title = data.get('guide_title')

    if not all([family_name, guide_path, guide_title]):
        return jsonify({'error': 'Missing required fields'}), 400

    user = get_user_by_family_name(family_name)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    add_bookmark(user['id'], guide_path, guide_title)
    return jsonify({'status': 'success'})


@app.route('/bookmarks', methods=['DELETE'])
def delete_bookmark():
    data = request.get_json()
    family_name = data.get('family_name')
    guide_path = data.get('guide_path')

    if not all([family_name, guide_path]):
        return jsonify({'error': 'Missing required fields'}), 400

    user = get_user_by_family_name(family_name)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    remove_bookmark(user['id'], guide_path)
    return jsonify({'status': 'success'})



@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
