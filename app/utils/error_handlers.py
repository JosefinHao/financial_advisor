from flask import request, jsonify
import logging
from datetime import datetime

def handle_api_error(error, message="An error occurred"):
    """Centralized error handler for API endpoints"""
    error_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Log the error with context
    logging.error(f"API Error [{error_id}]: {message} - {str(error)}")
    logging.error(f"Request: {request.method} {request.url}")
    logging.error(f"Request data: {request.get_data(as_text=True)}")
    
    # Return appropriate error response
    return jsonify({
        "error": message,
        "error_id": error_id,
        "timestamp": datetime.now().isoformat()
    }), 500

def validate_json_data(request):
    """Validate that request contains valid JSON data"""
    if not request.is_json:
        raise ValueError("Request must contain JSON data")
    
    data = request.get_json()
    if data is None:
        raise ValueError("Invalid JSON data")
    
    return data

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present in the data"""
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
    
    return data

def validate_numeric_range(value, min_val=None, max_val=None, field_name="value"):
    """Validate that a numeric value is within specified range"""
    try:
        num_value = float(value)
    except (ValueError, TypeError):
        raise ValueError(f"{field_name} must be a valid number")
    
    if min_val is not None and num_value < min_val:
        raise ValueError(f"{field_name} must be at least {min_val}")
    
    if max_val is not None and num_value > max_val:
        raise ValueError(f"{field_name} must be at most {max_val}")
    
    return num_value

def validate_string_length(value, max_length=None, field_name="value"):
    """Validate that a string value meets length requirements"""
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a string")
    
    if max_length is not None and len(value) > max_length:
        raise ValueError(f"{field_name} must be at most {max_length} characters")
    
    return value.strip()

def handle_database_error(error, operation="database operation"):
    """Handle database-specific errors"""
    logging.error(f"Database error during {operation}: {str(error)}")
    
    # Check for specific database error types
    if "duplicate key" in str(error).lower():
        return jsonify({"error": "Record already exists"}), 409
    elif "foreign key" in str(error).lower():
        return jsonify({"error": "Referenced record not found"}), 400
    elif "not null" in str(error).lower():
        return jsonify({"error": "Required field is missing"}), 400
    else:
        return jsonify({"error": f"Database error during {operation}"}), 500

def handle_validation_error(error, field_name=None):
    """Handle validation errors with proper HTTP status codes"""
    if field_name:
        return jsonify({"error": f"Validation error for {field_name}: {str(error)}"}), 400
    else:
        return jsonify({"error": f"Validation error: {str(error)}"}), 400

def handle_file_error(error, operation="file operation"):
    """Handle file-related errors"""
    logging.error(f"File error during {operation}: {str(error)}")
    
    if "not found" in str(error).lower():
        return jsonify({"error": "File not found"}), 404
    elif "permission" in str(error).lower():
        return jsonify({"error": "Permission denied"}), 403
    elif "too large" in str(error).lower():
        return jsonify({"error": "File too large"}), 413
    else:
        return jsonify({"error": f"File error during {operation}"}), 500 