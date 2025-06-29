from flask import request, jsonify
import logging
from datetime import datetime
import uuid
from typing import Optional, Dict, Any, Union
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class ErrorType(Enum):
    """Standardized error types"""
    VALIDATION_ERROR = "validation_error"
    AUTHENTICATION_ERROR = "authentication_error"
    AUTHORIZATION_ERROR = "authorization_error"
    NOT_FOUND_ERROR = "not_found_error"
    CONFLICT_ERROR = "conflict_error"
    RATE_LIMIT_ERROR = "rate_limit_error"
    EXTERNAL_SERVICE_ERROR = "external_service_error"
    DATABASE_ERROR = "database_error"
    FILE_ERROR = "file_error"
    INTERNAL_ERROR = "internal_error"

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class APIError(Exception):
    """Base exception for API errors"""
    def __init__(
        self,
        message: str,
        error_type: ErrorType = ErrorType.INTERNAL_ERROR,
        status_code: int = 500,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        details: Optional[Dict[str, Any]] = None,
        error_id: Optional[str] = None
    ):
        self.message = message
        self.error_type = error_type
        self.status_code = status_code
        self.severity = severity
        self.details = details or {}
        self.error_id = error_id or str(uuid.uuid4())
        self.timestamp = datetime.now()
        super().__init__(self.message)

class ValidationError(APIError):
    """Raised when input validation fails"""
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type=ErrorType.VALIDATION_ERROR,
            status_code=400,
            severity=ErrorSeverity.LOW,
            details=details or {"field": field} if field else {}
        )
        self.field = field

class NotFoundError(APIError):
    """Raised when a resource is not found"""
    def __init__(self, message: str, resource_type: Optional[str] = None):
        super().__init__(
            message=message,
            error_type=ErrorType.NOT_FOUND_ERROR,
            status_code=404,
            severity=ErrorSeverity.LOW,
            details={"resource_type": resource_type} if resource_type else {}
        )
        self.resource_type = resource_type

class ConflictError(APIError):
    """Raised when there's a conflict (e.g., duplicate resource)"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type=ErrorType.CONFLICT_ERROR,
            status_code=409,
            severity=ErrorSeverity.MEDIUM,
            details=details or {}
        )

class DatabaseError(APIError):
    """Raised when database operations fail"""
    def __init__(self, message: str, operation: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type=ErrorType.DATABASE_ERROR,
            status_code=500,
            severity=ErrorSeverity.HIGH,
            details=details or {"operation": operation} if operation else {}
        )

class FileError(APIError):
    """Raised when file operations fail"""
    def __init__(self, message: str, operation: Optional[str] = None, file_path: Optional[str] = None):
        super().__init__(
            message=message,
            error_type=ErrorType.FILE_ERROR,
            status_code=400,
            severity=ErrorSeverity.MEDIUM,
            details={"operation": operation, "file_path": file_path} if operation or file_path else {}
        )

class ExternalServiceError(APIError):
    """Raised when external service calls fail"""
    def __init__(self, message: str, service: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type=ErrorType.EXTERNAL_SERVICE_ERROR,
            status_code=502,
            severity=ErrorSeverity.HIGH,
            details=details or {"service": service} if service else {}
        )

def log_error(error: APIError, context: Optional[Dict[str, Any]] = None):
    """Log error with consistent format and context"""
    log_data = {
        "error_id": error.error_id,
        "error_type": error.error_type.value,
        "severity": error.severity.value,
        "error_message": error.message,
        "status_code": error.status_code,
        "timestamp": error.timestamp.isoformat(),
        "details": error.details,
        "request_method": request.method if request else None,
        "request_url": request.url if request else None,
        "request_data": request.get_data(as_text=True) if request else None,
        "context": context or {}
    }
    
    if error.severity == ErrorSeverity.CRITICAL:
        logger.critical(f"CRITICAL ERROR [{error.error_id}]: {error.message}", extra=log_data)
    elif error.severity == ErrorSeverity.HIGH:
        logger.error(f"HIGH SEVERITY ERROR [{error.error_id}]: {error.message}", extra=log_data)
    elif error.severity == ErrorSeverity.MEDIUM:
        logger.warning(f"MEDIUM SEVERITY ERROR [{error.error_id}]: {error.message}", extra=log_data)
    else:
        logger.info(f"LOW SEVERITY ERROR [{error.error_id}]: {error.message}", extra=log_data)

def create_error_response(error: APIError, include_details: bool = False) -> tuple:
    """Create standardized error response"""
    log_error(error)
    
    response = {
        "error": {
            "type": error.error_type.value,
            "message": error.message,
            "error_id": error.error_id,
            "timestamp": error.timestamp.isoformat()
        }
    }
    
    if include_details and error.details:
        response["error"]["details"] = error.details
    
    return jsonify(response), error.status_code

def handle_api_error(error: Exception, message: str = "An error occurred") -> tuple:
    """Legacy error handler - converts to new format"""
    if isinstance(error, APIError):
        return create_error_response(error)
    
    # Convert legacy errors to new format
    api_error = APIError(
        message=message,
        error_type=ErrorType.INTERNAL_ERROR,
        status_code=500,
        severity=ErrorSeverity.HIGH,
        details={"original_error": str(error)}
    )
    
    return create_error_response(api_error)

def validate_json_data(request) -> Dict[str, Any]:
    """Validate that request contains valid JSON data"""
    if not request.is_json:
        raise ValidationError("Request must contain JSON data", field="content_type")
    
    data = request.get_json()
    if data is None:
        raise ValidationError("Invalid JSON data", field="json_content")
    
    return data

def validate_required_fields(data: Dict[str, Any], required_fields: list) -> Dict[str, Any]:
    """Validate that all required fields are present in the data"""
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    
    if missing_fields:
        raise ValidationError(
            f"Missing required fields: {', '.join(missing_fields)}",
            field="required_fields",
            details={"missing_fields": missing_fields}
        )
    
    return data

def validate_numeric_range(
    value: Union[str, int, float], 
    min_val: Optional[float] = None, 
    max_val: Optional[float] = None, 
    field_name: str = "value"
) -> float:
    """Validate that a numeric value is within specified range"""
    try:
        num_value = float(value)
    except (ValueError, TypeError):
        raise ValidationError(f"{field_name} must be a valid number", field=field_name)
    
    if min_val is not None and num_value < min_val:
        raise ValidationError(
            f"{field_name} must be at least {min_val}",
            field=field_name,
            details={"min_value": min_val, "actual_value": num_value}
        )
    
    if max_val is not None and num_value > max_val:
        raise ValidationError(
            f"{field_name} must be at most {max_val}",
            field=field_name,
            details={"max_value": max_val, "actual_value": num_value}
        )
    
    return num_value

def validate_string_length(
    value: str, 
    max_length: Optional[int] = None, 
    min_length: Optional[int] = None,
    field_name: str = "value"
) -> str:
    """Validate that a string value meets length requirements"""
    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be a string", field=field_name)
    
    value = value.strip()
    
    if min_length is not None and len(value) < min_length:
        raise ValidationError(
            f"{field_name} must be at least {min_length} characters",
            field=field_name,
            details={"min_length": min_length, "actual_length": len(value)}
        )
    
    if max_length is not None and len(value) > max_length:
        raise ValidationError(
            f"{field_name} must be at most {max_length} characters",
            field=field_name,
            details={"max_length": max_length, "actual_length": len(value)}
        )
    
    return value

def validate_file_type(filename: str, allowed_extensions: set) -> str:
    """Validate file type based on extension"""
    if not filename:
        raise ValidationError("Filename is required", field="filename")
    
    file_extension = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    
    if file_extension not in allowed_extensions:
        raise ValidationError(
            f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}",
            field="file_type",
            details={"allowed_extensions": list(allowed_extensions), "actual_extension": file_extension}
        )
    
    return file_extension

def validate_file_size(file_size: int, max_size: int) -> None:
    """Validate file size"""
    if file_size > max_size:
        raise ValidationError(
            f"File too large. Maximum size is {max_size} bytes",
            field="file_size",
            details={"max_size": max_size, "actual_size": file_size}
        )

def handle_database_error(error: Exception, operation: str = "database operation") -> tuple:
    """Handle database-specific errors"""
    error_message = str(error).lower()
    
    if "duplicate key" in error_message:
        db_error = ConflictError("Record already exists", details={"operation": operation})
    elif "foreign key" in error_message:
        db_error = ValidationError("Referenced record not found", field="foreign_key", details={"operation": operation})
    elif "not null" in error_message:
        db_error = ValidationError("Required field is missing", field="required_field", details={"operation": operation})
    else:
        db_error = DatabaseError(f"Database error during {operation}", operation=operation, details={"original_error": str(error)})
    
    return create_error_response(db_error)

def handle_file_error(error: Exception, operation: str = "file operation", file_path: Optional[str] = None) -> tuple:
    """Handle file-related errors"""
    error_message = str(error).lower()
    
    if "not found" in error_message:
        file_error = NotFoundError("File not found", resource_type="file")
    elif "permission" in error_message:
        file_error = APIError("Permission denied", ErrorType.AUTHORIZATION_ERROR, 403, ErrorSeverity.MEDIUM)
    elif "too large" in error_message:
        file_error = ValidationError("File too large", field="file_size")
    else:
        file_error = FileError(f"File error during {operation}", operation=operation, file_path=file_path)
    
    return create_error_response(file_error)

# Decorator for consistent error handling
def handle_errors(func):
    """Decorator to wrap functions with consistent error handling"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except APIError:
            # Re-raise APIError as-is
            raise
        except ValueError as e:
            # Convert ValueError to ValidationError
            raise ValidationError(str(e))
        except Exception as e:
            # Convert other exceptions to APIError
            raise APIError(
                message="An unexpected error occurred",
                error_type=ErrorType.INTERNAL_ERROR,
                status_code=500,
                severity=ErrorSeverity.HIGH,
                details={"original_error": str(e)}
            )
    return wrapper 