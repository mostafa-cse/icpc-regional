import os
import json
import sqlite3
import datetime
import urllib.request
import re
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(APP_DIR, "database")
DB_PATH = os.path.join(DB_DIR, "icpc.db")
DATA_DIR = os.path.join(APP_DIR, "data")
CONTESTS_JSON_PATH = os.path.join(DATA_DIR, "contests.json")

os.makedirs(DB_DIR, exist_ok=True)

app = Flask(__name__, static_folder=APP_DIR)
CORS(app)

# -----------------------------------------------------------------------------
# Database Setup & Initialization
# -----------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            name TEXT,
            picture TEXT,
            provider TEXT DEFAULT 'google',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # 2. Contests table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS contests (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            season TEXT,
            year TEXT,
            region TEXT,
            type TEXT,
            difficulty INTEGER DEFAULT 0,
            duration INTEGER DEFAULT 18000,
            start_time INTEGER DEFAULT 0,
            gym_url TEXT,
            standings_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # 3. User contest marks & problem statuses table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_contest_marks (
            user_id TEXT NOT NULL,
            contest_id INTEGER NOT NULL,
            status TEXT DEFAULT 'unstarted',
            starred INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            problems_json TEXT DEFAULT '{}',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, contest_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE
        );
        """)
        
        # Indices for speed
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_contests_year ON contests(year);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_contests_region ON contests(region);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_marks_user ON user_contest_marks(user_id);")
        
        conn.commit()
        
    seed_contests_from_json()

def seed_contests_from_json():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM contests;")
        count = cursor.fetchone()[0]
        
        if count == 0 and os.path.exists(CONTESTS_JSON_PATH):
            print(f"Seeding database from {CONTESTS_JSON_PATH}...")
            with open(CONTESTS_JSON_PATH, "r", encoding="utf-8") as f:
                contests = json.load(f)
                
            for c in contests:
                cursor.execute("""
                INSERT OR REPLACE INTO contests 
                (id, name, season, year, region, type, difficulty, duration, start_time, gym_url, standings_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    c.get("id"),
                    c.get("name"),
                    c.get("season"),
                    c.get("year"),
                    c.get("region"),
                    c.get("type"),
                    c.get("difficulty", 0),
                    c.get("duration", 18000),
                    c.get("startTime", 0),
                    c.get("gymUrl"),
                    c.get("standingsUrl")
                ))
            conn.commit()
            print(f"Seeded {len(contests)} ICPC contests into SQLite database ({DB_PATH}).")
        else:
            print(f"SQLite database ready. Total contests in DB: {count}")

# -----------------------------------------------------------------------------
# REST API Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM contests;")
        contest_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        
    return jsonify({
        "status": "online",
        "database": "sqlite3",
        "db_path": DB_PATH,
        "total_contests": contest_count,
        "total_users": user_count,
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route("/api/contests", methods=["GET"])
def get_contests():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM contests ORDER BY id DESC;")
        rows = cursor.fetchall()
        
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "name": r["name"],
                "season": r["season"],
                "year": r["year"],
                "region": r["region"],
                "type": r["type"],
                "difficulty": r["difficulty"],
                "duration": r["duration"],
                "startTime": r["start_time"],
                "gymUrl": r["gym_url"],
                "standingsUrl": r["standings_url"]
            })
            
    return jsonify({"status": "OK", "count": len(result), "result": result})

@app.route("/api/auth/google", methods=["POST"])
def auth_google():
    data = request.json or {}
    user_id = data.get("id")
    email = data.get("email")
    name = data.get("name") or "ICPC Contestant"
    picture = data.get("picture") or ""
    provider = data.get("provider") or "google"
    
    if not user_id or not email:
        return jsonify({"status": "ERROR", "message": "Missing user_id or email"}), 400
        
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.datetime.now().isoformat()
        cursor.execute("""
        INSERT INTO users (id, email, name, picture, provider, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            email = excluded.email,
            name = excluded.name,
            picture = excluded.picture,
            last_login = excluded.last_login;
        """, (user_id, email, name, picture, provider, now))
        conn.commit()
        
    return jsonify({
        "status": "OK",
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "provider": provider
        }
    })

@app.route("/api/user/marks", methods=["GET"])
def get_user_marks():
    user_id = request.args.get("user_id", "guest")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT contest_id, status, starred, notes, problems_json, updated_at
        FROM user_contest_marks
        WHERE user_id = ?;
        """, (user_id,))
        rows = cursor.fetchall()
        
        marks = {}
        for r in rows:
            try:
                problems = json.loads(r["problems_json"]) if r["problems_json"] else {}
            except Exception:
                problems = {}
                
            marks[str(r["contest_id"])] = {
                "status": r["status"],
                "starred": bool(r["starred"]),
                "notes": r["notes"] or "",
                "problems": problems,
                "updatedAt": r["updated_at"]
            }
            
    return jsonify({"status": "OK", "user_id": user_id, "marks": marks})

@app.route("/api/user/marks", methods=["POST"])
def save_user_mark():
    data = request.json or {}
    user_id = data.get("user_id", "guest")
    contest_id = data.get("contest_id")
    status = data.get("status", "unstarted")
    starred = 1 if data.get("starred") else 0
    notes = data.get("notes", "")
    problems = data.get("problems", {})
    problems_json = json.dumps(problems)
    
    if not contest_id:
        return jsonify({"status": "ERROR", "message": "Missing contest_id"}), 400
        
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.datetime.now().isoformat()
        cursor.execute("""
        INSERT INTO user_contest_marks 
        (user_id, contest_id, status, starred, notes, problems_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, contest_id) DO UPDATE SET
            status = excluded.status,
            starred = excluded.starred,
            notes = excluded.notes,
            problems_json = excluded.problems_json,
            updated_at = excluded.updated_at;
        """, (user_id, contest_id, status, starred, notes, problems_json, now))
        conn.commit()
        
    return jsonify({"status": "OK", "saved": True, "contest_id": contest_id})

@app.route("/api/user/toggle-star", methods=["POST"])
def toggle_star():
    data = request.json or {}
    user_id = data.get("user_id", "guest")
    contest_id = data.get("contest_id")
    
    if not contest_id:
        return jsonify({"status": "ERROR", "message": "Missing contest_id"}), 400
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT starred FROM user_contest_marks WHERE user_id = ? AND contest_id = ?;", (user_id, contest_id))
        row = cursor.fetchone()
        
        new_starred = 1 if (not row or row["starred"] == 0) else 0
        now = datetime.datetime.now().isoformat()
        
        cursor.execute("""
        INSERT INTO user_contest_marks (user_id, contest_id, starred, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, contest_id) DO UPDATE SET
            starred = excluded.starred,
            updated_at = excluded.updated_at;
        """, (user_id, contest_id, new_starred, now))
        conn.commit()
        
    return jsonify({"status": "OK", "starred": bool(new_starred), "contest_id": contest_id})

@app.route("/api/user/reset", methods=["POST"])
def reset_user_marks():
    data = request.json or {}
    user_id = data.get("user_id", "guest")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_contest_marks WHERE user_id = ?;", (user_id,))
        deleted_count = cursor.rowcount
        conn.commit()
        
    return jsonify({"status": "OK", "cleared": True, "deleted_count": deleted_count})

# -----------------------------------------------------------------------------
# Static Web Assets Serving
# -----------------------------------------------------------------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    if not path or path == "":
        return send_from_directory(APP_DIR, "index.html")
    file_path = os.path.join(APP_DIR, path)
    if os.path.exists(file_path) and not os.path.isdir(file_path):
        return send_from_directory(APP_DIR, path)
    return send_from_directory(APP_DIR, "index.html")

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 3300))
    print(f"================================================================")
    print(f"ICPC Regional Hub Database Server running on http://localhost:{port}")
    print(f"SQLite Database File: {DB_PATH}")
    print(f"================================================================")
    app.run(host="0.0.0.0", port=port, debug=False)
