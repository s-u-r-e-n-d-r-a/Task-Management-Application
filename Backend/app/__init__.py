from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash

from config import Config
from app.models import db, User
from app.auth.routes import auth_bp
from app.users.routes import users_bp
from app.tasks.routes import tasks_bp

jwt = JWTManager()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

    
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(tasks_bp)

    
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username="admin").first():
            admin = User(
                username="admin",
                email="admin@example.com",
                password=generate_password_hash("admin123"),
                role="Admin",
                is_approved=True
            )
            db.session.add(admin)
            db.session.commit()
            print("✅ Default admin user created")

    
    @app.route('/')
    def index():
        return {"message": "Backend is running"}, 200

    return app
