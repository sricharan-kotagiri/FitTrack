import traceback
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.auth_routes import auth_bp
from routes.goals_routes import goals_bp
from routes.logs_routes import logs_bp
from routes.profile_routes import profile_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    app.register_blueprint(auth_bp)
    app.register_blueprint(goals_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(profile_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(Exception)
    def handle_all(e):
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
