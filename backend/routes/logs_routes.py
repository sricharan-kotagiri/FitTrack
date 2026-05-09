from flask import Blueprint, request, jsonify
from supabase_client import db_select, db_select_single, db_upsert, db_delete
from auth_middleware import token_required
from datetime import date

logs_bp = Blueprint("logs", __name__, url_prefix="/api/logs")

@logs_bp.route("/", methods=["GET"])
@token_required
def get_logs():
    uid = request.current_user_id
    match = {"user_id": uid}
    if request.args.get("goal_id"):
        match["goal_id"] = request.args.get("goal_id")
    logs = db_select("daily_logs", match, order="log_date.desc", limit=request.args.get("limit", 50))
    return jsonify({"logs": logs}), 200

@logs_bp.route("/", methods=["POST"])
@token_required
def create_or_update_log():
    data = request.get_json() or {}
    goal_id = data.get("goal_id")
    log_date = data.get("log_date") or date.today().isoformat()
    status = data.get("status")
    notes = (data.get("notes") or "").strip()

    if not goal_id:
        return jsonify({"error": "goal_id is required"}), 400
    if status not in ("completed", "missed"):
        return jsonify({"error": "status must be 'completed' or 'missed'"}), 400

    uid = request.current_user_id
    goal = db_select_single("goals", {"id": goal_id, "user_id": uid})
    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    if log_date < goal["start_date"]:
        return jsonify({"error": f"Goal hasn't started yet. Starts on {goal['start_date']}"}), 400

    log = db_upsert("daily_logs", {
        "user_id": uid,
        "goal_id": goal_id,
        "log_date": log_date,
        "status": status,
        "notes": notes
    }, on_conflict="user_id,goal_id,log_date")

    if not log:
        return jsonify({"error": "Failed to save log"}), 500

    return jsonify({"log": log, "message": "Check-in saved!"}), 200

@logs_bp.route("/<log_id>", methods=["DELETE"])
@token_required
def delete_log(log_id):
    uid = request.current_user_id
    if not db_select_single("daily_logs", {"id": log_id, "user_id": uid}):
        return jsonify({"error": "Log not found"}), 404

    db_delete("daily_logs", {"id": log_id})
    return jsonify({"message": "Log deleted"}), 200

@logs_bp.route("/today", methods=["GET"])
@token_required
def get_today_logs():
    uid = request.current_user_id
    today = date.today().isoformat()
    logs = db_select("daily_logs", {"user_id": uid, "log_date": today})
    return jsonify({"logs": logs, "date": today}), 200
