"""
Test script for the new standardized error handling system.
This script tests various error types and validation functions.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
    handle_errors
)

def test_error_classes():
    """Test that error classes are created correctly"""
    print("Testing error classes...")
    
    # Test ValidationError
    try:
        raise ValidationError("Invalid input", field="email")
    except ValidationError as e:
        assert e.error_type == ErrorType.VALIDATION_ERROR
        assert e.status_code == 400
        assert e.severity == ErrorSeverity.LOW
        assert e.field == "email"
        print("✓ ValidationError created correctly")
    
    # Test NotFoundError
    try:
        raise NotFoundError("User not found", resource_type="user")
    except NotFoundError as e:
        assert e.error_type == ErrorType.NOT_FOUND_ERROR
        assert e.status_code == 404
        assert e.severity == ErrorSeverity.LOW
        print("✓ NotFoundError created correctly")
    
    # Test ConflictError
    try:
        raise ConflictError("User already exists")
    except ConflictError as e:
        assert e.error_type == ErrorType.CONFLICT_ERROR
        assert e.status_code == 409
        assert e.severity == ErrorSeverity.MEDIUM
        print("✓ ConflictError created correctly")
    
    # Test DatabaseError
    try:
        raise DatabaseError("Connection failed", operation="query")
    except DatabaseError as e:
        assert e.error_type == ErrorType.DATABASE_ERROR
        assert e.status_code == 500
        assert e.severity == ErrorSeverity.HIGH
        print("✓ DatabaseError created correctly")
    
    # Test FileError
    try:
        raise FileError("File not found", operation="read", file_path="/path/to/file")
    except FileError as e:
        assert e.error_type == ErrorType.FILE_ERROR
        assert e.status_code == 400
        assert e.severity == ErrorSeverity.MEDIUM
        print("✓ FileError created correctly")
    
    # Test ExternalServiceError
    try:
        raise ExternalServiceError("API call failed", service="openai")
    except ExternalServiceError as e:
        assert e.error_type == ErrorType.EXTERNAL_SERVICE_ERROR
        assert e.status_code == 502
        assert e.severity == ErrorSeverity.HIGH
        print("✓ ExternalServiceError created correctly")

def test_validation_functions():
    """Test validation functions"""
    print("\nTesting validation functions...")
    
    # Test validate_numeric_range
    try:
        value = validate_numeric_range(50, 0, 100, "age")
        assert value == 50.0
        print("✓ validate_numeric_range with valid input")
    except ValidationError:
        print("✗ validate_numeric_range failed with valid input")
        return False
    
    # Test validate_numeric_range with invalid input
    try:
        validate_numeric_range(150, 0, 100, "age")
        print("✗ validate_numeric_range should have failed with out-of-range input")
        return False
    except ValidationError as e:
        assert e.field == "age"
        assert "at most 100" in e.message
        print("✓ validate_numeric_range correctly rejected out-of-range input")
    
    # Test validate_string_length
    try:
        value = validate_string_length("test", max_length=10, min_length=1, field_name="name")
        assert value == "test"
        print("✓ validate_string_length with valid input")
    except ValidationError:
        print("✗ validate_string_length failed with valid input")
        return False
    
    # Test validate_string_length with too long input
    try:
        validate_string_length("very long string", max_length=5, field_name="name")
        print("✗ validate_string_length should have failed with too long input")
        return False
    except ValidationError as e:
        assert e.field == "name"
        assert "at most 5 characters" in e.message
        print("✓ validate_string_length correctly rejected too long input")
    
    # Test validate_required_fields
    try:
        data = {"name": "John", "age": 30}
        result = validate_required_fields(data, ["name", "age"])
        assert result == data
        print("✓ validate_required_fields with all required fields")
    except ValidationError:
        print("✗ validate_required_fields failed with all required fields")
        return False
    
    # Test validate_required_fields with missing fields
    try:
        validate_required_fields({"name": "John"}, ["name", "age", "email"])
        print("✗ validate_required_fields should have failed with missing fields")
        return False
    except ValidationError as e:
        assert "age" in e.details["missing_fields"]
        assert "email" in e.details["missing_fields"]
        print("✓ validate_required_fields correctly rejected missing fields")

def test_decorator():
    """Test the handle_errors decorator"""
    print("\nTesting handle_errors decorator...")
    
    @handle_errors
    def function_that_raises_validation_error():
        raise ValidationError("Test validation error", field="test")
    
    @handle_errors
    def function_that_raises_value_error():
        raise ValueError("Test value error")
    
    @handle_errors
    def function_that_raises_generic_error():
        raise Exception("Test generic error")
    
    # Test that ValidationError is re-raised as-is
    try:
        function_that_raises_validation_error()
        print("✗ function_that_raises_validation_error should have raised ValidationError")
        return False
    except ValidationError as e:
        assert e.field == "test"
        print("✓ ValidationError correctly re-raised by decorator")
    
    # Test that ValueError is converted to ValidationError
    try:
        function_that_raises_value_error()
        print("✗ function_that_raises_value_error should have raised ValidationError")
        return False
    except ValidationError as e:
        assert "Test value error" in e.message
        print("✓ ValueError correctly converted to ValidationError")
    
    # Test that generic Exception is converted to APIError
    try:
        function_that_raises_generic_error()
        print("✗ function_that_raises_generic_error should have raised APIError")
        return False
    except APIError as e:
        assert e.error_type == ErrorType.INTERNAL_ERROR
        assert e.severity == ErrorSeverity.HIGH
        print("✓ Generic Exception correctly converted to APIError")

def main():
    """Run all tests"""
    print("Testing Standardized Error Handling System")
    print("=" * 50)
    
    try:
        test_error_classes()
        test_validation_functions()
        test_decorator()
        
        print("\n" + "=" * 50)
        print("✓ All error handling tests passed!")
        print("The standardized error handling system is working correctly.")
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 