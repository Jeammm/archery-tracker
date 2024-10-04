def register_blueprints(app):
    from .processing_routes import processing_bp
    from .auth_routes import auth_bp
    from .session_routes import session_bp
    from .stat_routes import stat_bp
    
    app.register_blueprint(processing_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(session_bp, url_prefix='/api')
    app.register_blueprint(stat_bp, url_prefix='/api')