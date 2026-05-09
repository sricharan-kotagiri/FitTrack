from flask import Blueprint, request, jsonify
from supabase_client import (
    auth_signup, auth_login, auth_refresh, auth_logout,
    auth_get_user, auth_resend, db_select_single, db_insert
)
from auth_middleware import token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    status, res = auth_signup(email, password, name)
    if status not in (200, 201) or res.get("error"):
        msg = res.get("msg") or res.get("message") or res.get("error") or "Signup failed"
        code = 409 if "already" in str(msg).lower() else 400
        return jsonify({"error": msg}), code

    user_id = res.get("id") or (res.get("user") or {}).get("id")
    if user_id:
        db_insert("profiles", {"id": user_id, "name": name, "email": email})

    return jsonify({
        "message": "Account created! Please check your email to verify your account.",
        "email": email
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    status, res = auth_login(email, password)
    if status != 200 or res.get("error"):
        msg = res.get("error_description") or res.get("msg") or "Invalid email or password"
        return jsonify({"error": msg}), 401

    user = res.get("user", {})
    if not user.get("email_confirmed_at"):
        return jsonify({
            "error": "Please verify your email before logging in.",
            "unverified": True,
            "email": email
        }), 403

    profile = db_select_single("profiles", {"id": user["id"]}) or {}
    return jsonify({
        "access_token": res.get("access_token"),
        "refresh_token": res.get("refresh_token"),
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
            "name": profile.get("name") or user.get("user_metadata", {}).get("name", ""),
            "joined": user.get("created_at")
        }
    }), 200

@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400
    auth_resend(email)
    return jsonify({"message": "Verification email resent. Please check your inbox."}), 200

@auth_bp.route("/refresh", methods=["POST"])
def refresh_token():
    data = request.get_json() or {}
    refresh = data.get("refresh_token")
    if not refresh:
        return jsonify({"error": "refresh_token required"}), 400

    status, res = auth_refresh(refresh)
    if status != 200:
        return jsonify({"error": "Token refresh failed"}), 401

    return jsonify({
        "access_token": res.get("access_token"),
        "refresh_token": res.get("refresh_token")
    }), 200

@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    auth_logout(request.access_token)
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    profile = db_select_single("profiles", {"id": request.current_user_id}) or {}
    return jsonify({
        "user": {
            "id": request.current_user_id,
            "email": request.current_user_email,
            "name": profile.get("name", ""),
            "joined": profile.get("created_at", "")
        }
    }), 200
