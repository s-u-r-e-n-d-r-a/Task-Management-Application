from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from datetime import datetime
from app.models import db, Task, User

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(user_id)


@tasks_bp.route("", methods=["POST"])
@jwt_required()
def create_task():
    user = get_current_user()
    data = request.get_json()

    if not data.get("title") or not data.get("description") or not data.get("due_date"):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        assignee_id = (
            data.get("assigned_to_id") if user.role == "Admin"
            else (data.get("assigned_to_id") or user.id)
        )

        new_task = Task(
            title=data["title"],
            description=data["description"],
            due_date=datetime.strptime(data["due_date"], "%Y-%m-%d").date(),
            priority=data.get("priority", "Low"),
            status=data.get("status", "Pending"),
            created_by_id=user.id,
            assigned_to_id=assignee_id,
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify({"message": "Task created successfully"}), 201
    except Exception as e:
        return jsonify({"error": f"Task creation error: {str(e)}"}), 500

@tasks_bp.route("", methods=["GET"])
@jwt_required()
def get_tasks():
    user = get_current_user()

    if user.role == "Admin":
        tasks = Task.query.options(joinedload(Task.creator), joinedload(Task.assignee)).all()
    else:
        tasks = Task.query.options(joinedload(Task.creator), joinedload(Task.assignee)).filter(
            or_(
                Task.assigned_to_id == user.id,
                Task.created_by_id == user.id,
                Task.creator.has(role="Admin")
            )
        ).all()

    return jsonify([task.to_dict() for task in tasks]), 200


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    user = get_current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    if user.role != "Admin" and task.assigned_to_id != user.id and task.created_by_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify(task.to_dict()), 200


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user = get_current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json()
    try:
        if user.role == "Admin":
            task.title = data.get("title", task.title)
            task.description = data.get("description", task.description)
            if data.get("due_date"):
                task.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date()
            task.priority = data.get("priority", task.priority)
            task.status = data.get("status", task.status)
            task.assigned_to_id = data.get("assigned_to_id", task.assigned_to_id)

        elif task.assigned_to_id == user.id:
            if "status" in data:
                task.status = data["status"]
            else:
                return jsonify({"error": "You can only update status"}), 400
        else:
            return jsonify({"error": "Unauthorized"}), 403

        db.session.commit()
        return jsonify({"message": "Task updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Task update error: {str(e)}"}), 500


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user = get_current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    if user.role != "Admin":
        return jsonify({"error": "Only admins can delete tasks"}), 403

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted successfully"}), 200


@tasks_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    admin = get_current_user()
    if admin.role != "Admin":
        return jsonify({"error": "Only admins can delete users"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        Task.query.filter(
            (Task.created_by_id == user.id) | (Task.assigned_to_id == user.id)
        ).delete(synchronize_session=False)
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User and associated tasks deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"User delete error: {str(e)}"}), 500
