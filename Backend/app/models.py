from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='User')
    is_approved = db.Column(db.Boolean, default=False)

    created_tasks = db.relationship(
        'Task', backref='creator', foreign_keys='Task.created_by_id', lazy=True
    )
    assigned_tasks = db.relationship(
        'Task', backref='assignee', foreign_keys='Task.assigned_to_id', lazy=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_approved": self.is_approved
        }

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    due_date = db.Column(db.Date)

    priority = db.Column(db.String(10))
    status = db.Column(db.String(20), default="Pending")

    created_by_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.strftime('%Y-%m-%d') if self.due_date else None,
            "priority": self.priority,
            "status": self.status,
            "created_by_id": self.created_by_id,
            "assigned_to_id": self.assigned_to_id,
            "created_by": {
                "id": self.creator.id,
                "username": self.creator.username,
                "role": self.creator.role,
            } if self.creator else None,
            "assigned_to": {
                "id": self.assignee.id,
                "username": self.assignee.username,
                "role": self.assignee.role,
            } if self.assignee else None,
        }
