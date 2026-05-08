import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from extractor import process_scoreboard
from database import init_db, save_scoreboard, get_user_scoreboards, search_player_matches


# Initialize database on startup
init_db()

app = Flask(__name__)

CORS(app) # Enable CORS for frontend integration

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
        # Save to temp path
        temp_path = save_temp_file(file)
        
        # Run extraction
        results = process_scoreboard(temp_path)
        
        # Cleanup
        os.remove(temp_path)
        
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/save', methods=['POST'])
def save_data():
    """Endpoint to save extracted scoreboard data to the database."""
    req_data = request.get_json()
    
    user_id = req_data.get('user_id')
    data = req_data.get('data')
    
    if not user_id or not data:
        return jsonify({"error": "Missing user_id or data"}), 400
    
    try:
        scoreboard_id = save_scoreboard(user_id, data)
        return jsonify({
            "status": "success",
            "scoreboard_id": scoreboard_id
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



@app.route('/health', methods=['GET'])

def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    # Using 0.0.0.0 to allow access from local network if needed
    app.run(host='0.0.0.0', port=5000, debug=True)
