"""
Test suite for utility functions.
"""

import pytest
import tempfile
import os
import pandas as pd
from unittest.mock import patch, MagicMock, mock_open
from sqlalchemy import text
from tests.conftest import create_test_file

from app.utils.error_handlers import (
    ValidationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    FileError,
    ExternalServiceError,
    APIError,
    ErrorType,
    ErrorSeverity,
    validate_numeric_range,
    validate_string_length,
    validate_required_fields,
    validate_file_type,
    validate_file_size,
    handle_errors,
    create_error_response
)

from app.utils.database import get_db_session, DatabaseManager
from app.utils.document_processor import (
    extract_text_from_pdf,
    extract_text_from_txt,
    extract_data_from_csv,
    analyze_document_with_ai
)
from app.main import create_app

class TestErrorHandling:
    """Test error handling utilities."""
    
    def test_validation_error_creation(self):
        """Test ValidationError creation and properties."""
        error = ValidationError("Invalid input", field="email")
        
        assert error.message == "Invalid input"
        assert error.field == "email"
        assert error.error_type == ErrorType.VALIDATION_ERROR
        assert error.status_code == 400
        assert error.severity == ErrorSeverity.LOW
        assert error.error_id is not None
        assert error.timestamp is not None
    
    def test_not_found_error_creation(self):
        """Test NotFoundError creation and properties."""
        error = NotFoundError("User not found", resource_type="user")
        
        assert error.message == "User not found"
        assert error.resource_type == "user"
        assert error.error_type == ErrorType.NOT_FOUND_ERROR
        assert error.status_code == 404
        assert error.severity == ErrorSeverity.LOW
    
    def test_validate_numeric_range_valid(self):
        """Test validate_numeric_range with valid input."""
        result = validate_numeric_range(50, 0, 100, "age")
        assert result == 50.0
    
    def test_validate_numeric_range_string_input(self):
        """Test validate_numeric_range with string input."""
        result = validate_numeric_range("50", 0, 100, "age")
        assert result == 50.0
    
    def test_validate_numeric_range_below_min(self):
        """Test validate_numeric_range with value below minimum."""
        with pytest.raises(ValidationError) as exc_info:
            validate_numeric_range(-5, 0, 100, "age")
        
        assert exc_info.value.field == "age"
        assert "at least 0" in exc_info.value.message
    
    def test_validate_numeric_range_above_max(self):
        """Test validate_numeric_range with value above maximum."""
        with pytest.raises(ValidationError) as exc_info:
            validate_numeric_range(150, 0, 100, "age")
        
        assert exc_info.value.field == "age"
        assert "at most 100" in exc_info.value.message
    
    def test_validate_numeric_range_invalid_type(self):
        """Test validate_numeric_range with invalid type."""
        with pytest.raises(ValidationError) as exc_info:
            validate_numeric_range("invalid", 0, 100, "age")
        
        assert exc_info.value.field == "age"
        assert "must be a valid number" in exc_info.value.message
    
    def test_validate_string_length_valid(self):
        """Test validate_string_length with valid input."""
        result = validate_string_length("test", max_length=10, min_length=1, field_name="name")
        assert result == "test"
    
    def test_validate_string_length_too_short(self):
        """Test validate_string_length with string too short."""
        with pytest.raises(ValidationError) as exc_info:
            validate_string_length("a", max_length=10, min_length=3, field_name="name")
        
        assert exc_info.value.field == "name"
        assert "at least 3 characters" in exc_info.value.message
    
    def test_validate_string_length_too_long(self):
        """Test validate_string_length with string too long."""
        with pytest.raises(ValidationError) as exc_info:
            validate_string_length("very long string", max_length=5, field_name="name")
        
        assert exc_info.value.field == "name"
        assert "at most 5 characters" in exc_info.value.message
    
    def test_validate_string_length_invalid_type(self):
        """Test validate_string_length with invalid type."""
        with pytest.raises(ValidationError) as exc_info:
            validate_string_length(123, max_length=10, field_name="name")
        
        assert exc_info.value.field == "name"
        assert "must be a string" in exc_info.value.message
    
    def test_validate_required_fields_all_present(self):
        """Test validate_required_fields with all required fields present."""
        data = {"name": "John", "age": 30, "email": "john@example.com"}
        result = validate_required_fields(data, ["name", "age", "email"])
        assert result == data
    
    def test_validate_required_fields_missing(self):
        """Test validate_required_fields with missing fields."""
        data = {"name": "John"}
        
        with pytest.raises(ValidationError) as exc_info:
            validate_required_fields(data, ["name", "age", "email"])
        
        assert "age" in exc_info.value.details["missing_fields"]
        assert "email" in exc_info.value.details["missing_fields"]
    
    def test_validate_required_fields_none_values(self):
        """Test validate_required_fields with None values."""
        data = {"name": "John", "age": None, "email": "john@example.com"}
        
        with pytest.raises(ValidationError) as exc_info:
            validate_required_fields(data, ["name", "age", "email"])
        
        assert "age" in exc_info.value.details["missing_fields"]
    
    def test_validate_file_type_valid(self):
        """Test validate_file_type with valid file type."""
        result = validate_file_type("document.pdf", {"pdf", "txt", "csv"})
        assert result == "pdf"
    
    def test_validate_file_type_invalid(self):
        """Test validate_file_type with invalid file type."""
        with pytest.raises(ValidationError) as exc_info:
            validate_file_type("document.invalid", {"pdf", "txt", "csv"})
        
        assert exc_info.value.field == "file_type"
        assert "not allowed" in exc_info.value.message
    
    def test_validate_file_type_no_extension(self):
        """Test validate_file_type with file without extension."""
        with pytest.raises(ValidationError) as exc_info:
            validate_file_type("document", {"pdf", "txt", "csv"})
        
        assert exc_info.value.field == "file_type"
        assert "not allowed" in exc_info.value.message
    
    def test_validate_file_size_valid(self):
        """Test validate_file_size with valid size."""
        validate_file_size(1024, 2048)  # Should not raise
    
    def test_validate_file_size_too_large(self):
        """Test validate_file_size with file too large."""
        with pytest.raises(ValidationError) as exc_info:
            validate_file_size(4096, 2048)
        
        assert exc_info.value.field == "file_size"
        assert "too large" in exc_info.value.message
    
    def test_handle_errors_decorator_validation_error(self):
        """Test handle_errors decorator with ValidationError."""
        @handle_errors
        def function_that_raises_validation_error():
            raise ValidationError("Test error", field="test")
        
        with pytest.raises(ValidationError) as exc_info:
            function_that_raises_validation_error()
        
        assert exc_info.value.field == "test"
    
    def test_handle_errors_decorator_value_error(self):
        """Test handle_errors decorator with ValueError."""
        @handle_errors
        def function_that_raises_value_error():
            raise ValueError("Test value error")
        
        with pytest.raises(ValidationError) as exc_info:
            function_that_raises_value_error()
        
        assert "Test value error" in exc_info.value.message
    
    def test_handle_errors_decorator_generic_error(self):
        """Test handle_errors decorator with generic Exception."""
        @handle_errors
        def function_that_raises_generic_error():
            raise Exception("Test generic error")
        
        with pytest.raises(APIError) as exc_info:
            function_that_raises_generic_error()
        
        assert exc_info.value.error_type == ErrorType.INTERNAL_ERROR
        assert exc_info.value.severity == ErrorSeverity.HIGH

class TestDatabaseUtils:
    """Test database utility functions."""
    
    def test_get_db_session_context_manager(self, db_session):
        """Test get_db_session context manager."""
        with get_db_session() as session:
            assert session is not None
            # Test that we can perform a simple query
            result = session.execute(text("SELECT 1")).scalar()
            assert result == 1
    
    def test_database_manager_creation(self):
        """Test DatabaseManager creation."""
        manager = DatabaseManager()
        assert manager is not None
    
    @patch('app.utils.database.SessionLocal')
    def test_database_session_error_handling(self, mock_session_local):
        """Test database session error handling."""
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.execute.side_effect = Exception("Database error")
        
        with pytest.raises(Exception):
            with get_db_session() as session:
                session.execute(text("SELECT 1"))

class TestDocumentProcessor:
    """Test document processing utilities."""
    
    def test_extract_text_from_txt(self):
        """Test extracting text from TXT file."""
        content = "This is a test document content."
        temp_file = create_test_file(content, ".txt")
        
        try:
            result = extract_text_from_txt(temp_file)
            assert result == content
        finally:
            os.unlink(temp_file)
    
    def test_extract_text_from_txt_file_not_found(self):
        """Test extracting text from non-existent TXT file."""
        with pytest.raises(FileNotFoundError):
            extract_text_from_txt("nonexistent.txt")
    
    def test_extract_data_from_csv(self):
        """Test extracting data from CSV file."""
        # Create a test CSV file
        data = {
            'Name': ['John', 'Jane', 'Bob'],
            'Age': [30, 25, 35],
            'Salary': [50000, 60000, 55000]
        }
        df = pd.DataFrame(data)
        
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
        df.to_csv(temp_file.name, index=False)
        temp_file.close()
        
        try:
            result = extract_data_from_csv(temp_file.name)
            assert "File: " in result
            assert "Shape: 3 rows, 3 columns" in result
            assert "Name" in result
            assert "Age" in result
            assert "Salary" in result
        finally:
            os.unlink(temp_file.name)
    
    def test_extract_data_from_excel(self):
        """Test extracting data from Excel file."""
        # Create a test Excel file
        data = {
            'Name': ['John', 'Jane', 'Bob'],
            'Age': [30, 25, 35],
            'Salary': [50000, 60000, 55000]
        }
        df = pd.DataFrame(data)
        
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.xlsx', delete=False)
        df.to_excel(temp_file.name, index=False)
        temp_file.close()
        
        try:
            result = extract_data_from_csv(temp_file.name)
            assert "File: " in result
            assert "Shape: 3 rows, 3 columns" in result
        finally:
            os.unlink(temp_file.name)
    
    def test_extract_data_from_unsupported_file(self):
        """Test extracting data from unsupported file type."""
        temp_file = create_test_file("Test content", ".invalid")
        
        try:
            with pytest.raises(ValueError) as exc_info:
                extract_data_from_csv(temp_file)
            assert "Unsupported file type" in str(exc_info.value)
        finally:
            os.unlink(temp_file)
    
    @patch('app.utils.document_processor.OpenAI')
    def test_analyze_document_with_ai(self, mock_openai_class):
        """Test AI document analysis."""
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a financial document analysis."
        mock_client.chat.completions.create.return_value = mock_response
        
        content = "Sample financial document content for analysis."
        result = analyze_document_with_ai(content, "txt", "test.txt")
        
        assert "This is a financial document analysis." in result
        mock_client.chat.completions.create.assert_called_once()

class TestErrorResponseFormat:
    """Test error response formatting."""
    
    @patch('app.utils.error_handlers.logger')
    def test_create_error_response(self, mock_logger):
        """Test creating standardized error response."""
        app = create_app()
        with app.app_context():
            error = ValidationError("Invalid input", field="email")
            response, status_code = create_error_response(error)
            assert status_code == 400
            data = response.get_json()
            assert 'error' in data
            assert data['error']['type'] == 'validation_error'
            assert data['error']['message'] == 'Invalid input'
            assert 'error_id' in data['error']
            assert 'timestamp' in data['error']
    
    @patch('app.utils.error_handlers.logger')
    def test_create_error_response_with_details(self, mock_logger):
        """Test creating error response with details."""
        app = create_app()
        with app.app_context():
            error = ValidationError("Invalid input", field="email", details={"custom": "detail"})
            response, status_code = create_error_response(error, include_details=True)
            data = response.get_json()
            assert 'details' in data['error']
            assert data['error']['details']['custom'] == 'detail'
    
    @patch('app.utils.error_handlers.logger')
    def test_create_error_response_without_details(self, mock_logger):
        """Test creating error response without details."""
        app = create_app()
        with app.app_context():
            error = ValidationError("Invalid input", field="email", details={"custom": "detail"})
            response, status_code = create_error_response(error, include_details=False)
            data = response.get_json()
            assert 'details' not in data['error'] 