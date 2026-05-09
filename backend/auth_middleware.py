from functools import wraps
from flask import request, jsonify
from supabase_client import auth_get_user

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401
        token = auth_header.split(" ")[1]
        status, user = auth_get_user(token)
        if status != 200 or not user.get("id"):
            return jsonify({"error": "Invalid or expired token"}), 401
        request.current_user_id = user["id"]
        request.current_user_email = user.get("email", "")
        request.access_token = token
        return f(*args, **kwargs)
    return decorated
