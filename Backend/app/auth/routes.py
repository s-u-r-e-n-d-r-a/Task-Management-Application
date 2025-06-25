from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400

        if User.query.filter((User.username == data["username"]) | (User.email == data["email"])).first():
            return jsonify({"error": "User already exists"}), 400

        user = User(
            username=data["username"],
            email=data["email"],
            password=generate_password_hash(data["password"]),
            role=data.get("role", "User"),
            is_approved=False
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User registered successfully. Waiting for admin approval."}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400

        user = User.query.filter_by(email=data["email"]).first()
        if not user or not check_password_hash(user.password, data["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        
        if user.role != "Admin" and not user.is_approved:
            return jsonify({"error": "User not approved by admin"}), 403

        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            "access_token": access_token,
            "user": {
                #"id": user.id,
                #"username": user.username,
                #"email": user.email,
                "role": user.role,
                "is_approved": user.is_approved
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/approve/<int:user_id>", methods=["PUT"])
@jwt_required()
def approve_user(user_id):
    current_user = User.query.get(get_jwt_identity())
    if current_user.role != "Admin":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    role = data.get("role")

    if not role:
        return jsonify({"error": "Role is required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.role = role
    user.is_approved = True
    db.session.commit()

    return jsonify({"message": f"User {user.username} approved as {role}"}), 200
