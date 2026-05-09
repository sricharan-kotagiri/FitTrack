from flask import Blueprint, request, jsonify
from supabase_client import db_select, db_select_single, db_update, db_delete, auth_delete_user
from auth_middleware import token_required
from routes.goals_routes import goal_status, compute_stats

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

@profile_bp.route("/", methods=["GET"])
@token_required
def get_profile():
    uid = request.current_user_id
    profile = db_select_single("profiles", {"id": uid})
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    goals = db_select("goals", {"user_id": uid})
    logs = db_select("daily_logs", {"user_id": uid})
    logs_map = {f"{l['goal_id']}_{l['log_date']}": l for l in logs}

    total_completed = sum(1 for l in logs if l["status"] == "completed")
    total_missed = sum(1 for l in logs if l["status"] == "missed")
    best_streak = max((compute_stats(g, logs_map)["streak"] for g in goals), default=0)

    return jsonify({
        "profile": profile,
        "stats": {
            "total_goals": len(goals),
            "active_goals": sum(1 for g in goals if goal_status(g) == "active"),
            "upcoming_goals": sum(1 for g in goals if goal_status(g) == "upcoming"),
            "finished_goals": sum(1 for g in goals if goal_status(g) == "finished"),
            "total_completed": total_completed,
            "total_missed": total_missed,
            "best_streak": best_streak,
            "overall_pct": round(total_completed / (total_completed + total_missed) * 100) if (total_completed + total_missed) > 0 else 0
        },
        "goals_breakdown": [
            {**g, "status": goal_status(g), "stats": compute_stats(g, logs_map)}
            for g in goals
        ]
    }), 200

@profile_bp.route("/", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    db_update("profiles", {"name": name}, {"id": request.current_user_id})
    return jsonify({"message": "Profile updated"}), 200

@profile_bp.route("/", methods=["DELETE"])
@token_required
def delete_account():
    uid = request.current_user_id
    db_delete("daily_logs", {"user_id": uid})
    db_delete("goals", {"user_id": uid})
    db_delete("profiles", {"id": uid})
    auth_delete_user(uid)
    return jsonify({"message": "Account deleted"}), 200
