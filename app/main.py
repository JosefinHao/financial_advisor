from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import text
from werkzeug.exceptions import BadRequest

# Import blueprints
from app.routes import conversations_bp, calculators_bp, documents_bp, education_bp, dashboard_bp

# Import utilities
from app.utils.error_handlers import (
    handle_api_error, 
    create_error_response, 
    APIError, 
    NotFoundError, 
    ValidationError,
    ErrorType, 
    ErrorSeverity
)
from app.utils.database import get_db_session

# Load environment variables
load_dotenv()

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Register blueprints
    app.register_blueprint(conversations_bp, url_prefix='/api/v1')
    app.register_blueprint(calculators_bp, url_prefix='/api/v1')
    app.register_blueprint(documents_bp, url_prefix='/api/v1')
    app.register_blueprint(education_bp, url_prefix='/api/v1')
    app.register_blueprint(dashboard_bp, url_prefix='/api/v1')
    
    # Health check endpoint
    @app.route("/health", methods=["GET"])
    def health():
        """Detailed health check"""
        health_status = {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "services": {
                "database": "unknown",
                "openai": "unknown"
            },
            "issues": []
        }
        
        # Check database using new session management
        try:
            with get_db_session() as session:
                # Simple query to test database connection
                session.execute(text("SELECT 1"))
            health_status["services"]["database"] = "connected"
        except Exception as e:
            health_status["services"]["database"] = "error"
            health_status["issues"].append(f"Database error: {str(e)}")
        
        # Check OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            health_status["services"]["openai"] = "configured"
        else:
            health_status["services"]["openai"] = "not_configured"
            health_status["issues"].append("OpenAI API key not set")
        
        if health_status["issues"]:
            health_status["status"] = "degraded"
        
        return jsonify(health_status)
    
    # Ping endpoint
    @app.route("/ping", methods=["GET"])
    def ping():
        """Simple health check"""
        return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})
    
    # API documentation endpoint
    @app.route("/api", methods=["GET"])
    def api_docs():
        """API documentation"""
        return jsonify({
            "name": "Financial Advisor API",
            "version": "1.0.0",
            "description": "AI-powered financial advisory system",
            "endpoints": {
                "conversations": {
                    "POST /api/v1/conversations": "Create a new conversation",
                    "GET /api/v1/conversations": "Get all conversations",
                    "GET /api/v1/conversations/<id>": "Get specific conversation",
                    "POST /api/v1/conversations/<id>": "Send message to conversation",
                    "POST /api/v1/conversations/<id>/rename": "Rename conversation",
                    "POST /api/v1/conversations/<id>/auto_rename": "Auto-rename conversation",
                    "PATCH /api/v1/conversations/<id>/tags": "Update conversation tags",
                    "DELETE /api/v1/conversations/<id>": "Delete conversation"
                },
                "calculators": {
                    "POST /api/v1/calculators/retirement": "Retirement calculator",
                    "POST /api/v1/calculators/mortgage": "Mortgage calculator",
                    "POST /api/v1/calculators/compound-interest": "Compound interest calculator"
                },
                "documents": {
                    "POST /api/v1/documents/upload": "Upload and analyze document",
                    "GET /api/v1/documents/history": "Get document history",
                    "DELETE /api/v1/documents/<filename>": "Delete document",
                    "POST /api/v1/documents/<filename>/analyze": "Re-analyze document"
                }
            }
        })
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        """Handle bad request errors, including JSON parsing errors"""
        if isinstance(error, BadRequest):
            validation_error = ValidationError(
                "Invalid JSON data",
                field="json_content"
            )
            return create_error_response(validation_error)
        # Handle other 400 errors
        validation_error = ValidationError(
            str(error),
            field="request"
        )
        return create_error_response(validation_error)
    
    @app.errorhandler(404)
    def not_found(error):
        not_found_error = NotFoundError(
            "Endpoint not found",
            resource_type="endpoint"
        )
        return create_error_response(not_found_error)
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        method_error = APIError(
            "Method not allowed",
            error_type=ErrorType.VALIDATION_ERROR,
            status_code=405,
            severity=ErrorSeverity.LOW,
            details={"allowed_methods": error.valid_methods if hasattr(error, 'valid_methods') else []}
        )
        return create_error_response(method_error)
    
    @app.errorhandler(500)
    def internal_error(error):
        return handle_api_error(error, "Internal server error")
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(e):
        return handle_api_error(e, "An unexpected error occurred")
    
    @app.errorhandler(BadRequest)
    def handle_bad_request(error):
        print('DEBUG: handle_bad_request triggered')
        validation_error = ValidationError(
            "Invalid JSON data",
            field="json_content"
        )
        return create_error_response(validation_error)
    
    @app.before_request
    def catch_json_parsing_errors():
        if request.method in ["POST", "PUT", "PATCH"] and request.content_type and "application/json" in request.content_type:
            try:
                # Only try to parse if there is data
                if request.data:
                    request.get_json()
            except BadRequest:
                validation_error = ValidationError(
                    "Invalid JSON data",
                    field="json_content"
                )
                return create_error_response(validation_error)
    
    return app

# Create the application instance
app = create_app()

if __name__ == "__main__":
    # Get configuration from environment
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))
    
    app.run(
        host=host,
        port=port,
        debug=debug_mode
    ) 