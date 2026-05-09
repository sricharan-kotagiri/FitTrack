from flask import Blueprint, request, jsonify
from supabase_client import db_select, db_select_single, db_insert, db_update, db_delete, db_upsert
from auth_middleware import token_required
from datetime import date, timedelta, datetime

goals_bp = Blueprint("goals", __name__, url_prefix="/api/goals")

CATEGORIES = ["Cardio", "Strength", "Flexibility", "Nutrition", "Wellness", "General"]
COLORS = ["green", "blue", "amber", "purple", "red"]

def offset_date(base, days):
    return (datetime.strptime(base, "%Y-%m-%d").date() + timedelta(days=days)).isoformat()

def goal_status(goal):
    today = date.today().isoformat()
    if goal["start_date"] > today:
        return "upcoming"
    end = offset_date(goal["start_date"], goal["duration_days"])
    return "finished" if today >= end else "active"

def compute_stats(goal, logs_map):
    today = date.today().isoformat()
    gid = goal["id"]
    completed = missed = tracked = streak = 0
    
    for i in range(goal["duration_days"]):
        d = offset_date(goal["start_date"], i)
        if d > today:
            break
        tracked += 1
        key = f"{gid}_{d}"
        if key in logs_map:
            if logs_map[key]["status"] == "completed":
                completed += 1
            else:
                missed += 1
    
    pct = round((completed / tracked) * 100) if tracked > 0 else 0
    
    for i in range(365):
        d = (date.today() - timedelta(days=i)).isoformat()
        if d < goal["start_date"]:
            break
        key = f"{gid}_{d}"
        if key in logs_map and logs_map[key]["status"] == "completed":
            streak += 1
        elif i > 0:
            break
    
    return {
        "completed": completed,
        "missed": missed,
        "tracked_days": tracked,
        "pct": pct,
        "streak": streak,
        "days_left": max(0, goal["duration_days"] - completed),
        "today_log": logs_map.get(f"{gid}_{date.today().isoformat()}")
    }

@goals_bp.route("/", methods=["GET"])
@token_required
def get_goals():
    uid = request.current_user_id
    goals = db_select("goals", {"user_id": uid}, order="created_at")
    logs = db_select("daily_logs", {"user_id": uid})
    logs_map = {f"{l['goal_id']}_{l['log_date']}": l for l in logs}
    enriched = [{**g, "status": goal_status(g), "stats": compute_stats(g, logs_map)} for g in goals]
    return jsonify({"goals": enriched}), 200

@goals_bp.route("/", methods=["POST"])
@token_required
def create_goal():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    duration = data.get("duration_days")
    
    if not title:
        return jsonify({"error": "Goal title is required"}), 400
    if not duration or int(duration) < 1:
        return jsonify({"error": "Valid duration required"}), 400
    
    category = data.get("category", "General")
    if category not in CATEGORIES:
        category = "General"
    color = data.get("color", "green")
    if color not in COLORS:
        color = "green"
    
    goal = db_insert("goals", {
        "user_id": request.current_user_id,
        "title": title,
        "duration_days": int(duration),
        "start_date": data.get("start_date") or date.today().isoformat(),
        "category": category,
        "color": color,
        "notes": (data.get("notes") or "").strip()
    })
    
    if not goal:
        return jsonify({"error": "Failed to create goal"}), 500
    
    return jsonify({"goal": {**goal, "status": goal_status(goal), "stats": compute_stats(goal, {})}}), 201

@goals_bp.route("/<goal_id>", methods=["PUT"])
@token_required
def update_goal(goal_id):
    uid = request.current_user_id
    existing = db_select_single("goals", {"id": goal_id, "user_id": uid})
    if not existing:
        return jsonify({"error": "Goal not found"}), 404
    
    data = request.get_json() or {}
    updates = {}
    if data.get("title", "").strip():
        updates["title"] = data["title"].strip()
    if data.get("duration_days") and int(data["duration_days"]) > 0:
        updates["duration_days"] = int(data["duration_days"])
    if data.get("start_date"):
        updates["start_date"] = data["start_date"]
    if data.get("category") in CATEGORIES:
        updates["category"] = data["category"]
    if data.get("color") in COLORS:
        updates["color"] = data["color"]
    if "notes" in data:
        updates["notes"] = data["notes"].strip()
    
    goal = db_update("goals", updates, {"id": goal_id})
    goal = db_select_single("goals", {"id": goal_id}) or goal
    logs = db_select("daily_logs", {"user_id": uid, "goal_id": goal_id})
    logs_map = {f"{l['goal_id']}_{l['log_date']}": l for l in logs}
    
    return jsonify({"goal": {**goal, "status": goal_status(goal), "stats": compute_stats(goal, logs_map)}}), 200

@goals_bp.route("/<goal_id>", methods=["DELETE"])
@token_required
def delete_goal(goal_id):
    uid = request.current_user_id
    if not db_select_single("goals", {"id": goal_id, "user_id": uid}):
        return jsonify({"error": "Goal not found"}), 404
    
    db_delete("daily_logs", {"goal_id": goal_id, "user_id": uid})
    db_delete("goals", {"id": goal_id})
    
    return jsonify({"message": "Goal deleted"}), 200

@goals_bp.route("/<goal_id>/stats", methods=["GET"])
@token_required
def get_goal_stats(goal_id):
    uid = request.current_user_id
    goal = db_select_single("goals", {"id": goal_id, "user_id": uid})
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    
    logs = db_select("daily_logs", {"user_id": uid, "goal_id": goal_id})
    logs_map = {f"{l['goal_id']}_{l['log_date']}": l for l in logs}
    
    return jsonify({
        "goal": goal,
        "status": goal_status(goal),
        "stats": compute_stats(goal, logs_map),
        "logs": logs
    }), 200
