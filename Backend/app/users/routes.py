from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from app.models import User

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.route("/me", methods=["GET"])
@jwt_required()
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_approved": user.is_approved
    })


@users_bp.route("", methods=["GET"])
@jwt_required()
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def get_all_users():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if user.role != "Admin":
        return jsonify({"error": "Unauthorized"}), 403

    users = User.query.all()
    return jsonify([
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_approved": u.is_approved
        } for u in users
    ])
