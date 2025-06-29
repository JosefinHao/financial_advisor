# Utils package initialization
from .error_handlers import (
    # Core error classes
    APIError,
    ValidationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    FileError,
    ExternalServiceError,
    
    # Error types and severity
    ErrorType,
    ErrorSeverity,
    
    # Response functions
    create_error_response,
    handle_api_error,
    
    # Validation functions
    validate_json_data,
    validate_required_fields,
    validate_numeric_range,
    validate_string_length,
    validate_file_type,
    validate_file_size,
    
    # Error handling functions
    handle_database_error,
    handle_file_error,
    
    # Decorator
    handle_errors
)

from .document_processor import extract_text_from_pdf, extract_text_from_txt, extract_data_from_csv, analyze_document_with_ai
from .database import get_db_session, get_db_session_dependency, execute_in_transaction, DatabaseManager

__all__ = [
    # Error handling
    'APIError',
    'ValidationError', 
    'NotFoundError',
    'ConflictError',
    'DatabaseError',
    'FileError',
    'ExternalServiceError',
    'ErrorType',
    'ErrorSeverity',
    'create_error_response',
    'handle_api_error', 
    'validate_json_data',
    'validate_required_fields',
    'validate_numeric_range',
    'validate_string_length',
    'validate_file_type',
    'validate_file_size',
    'handle_database_error',
    'handle_file_error',
    'handle_errors',
    
    # Document processing
    'extract_text_from_pdf',
    'extract_text_from_txt', 
    'extract_data_from_csv',
    'analyze_document_with_ai',
    
    # Database
    'get_db_session',
    'get_db_session_dependency',
    'execute_in_transaction',
    'DatabaseManager'
] 