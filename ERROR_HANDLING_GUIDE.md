# Error Handling Guide

## Overview

This document describes the standardized error handling system implemented in the Financial Advisor application. The system provides consistent error responses, proper logging, and error tracking across all API endpoints.

## Key Features

- **Standardized Error Types**: Predefined error categories with appropriate HTTP status codes
- **Error Tracking**: Unique error IDs for debugging and monitoring
- **Structured Logging**: Consistent log format with severity levels
- **Validation Helpers**: Built-in validation functions with proper error handling
- **Decorator Support**: `@handle_errors` decorator for automatic error handling

## Error Types

### Core Error Classes

| Error Class | HTTP Status | Use Case |
|-------------|-------------|----------|
| `ValidationError` | 400 | Input validation failures |
| `NotFoundError` | 404 | Resources not found |
| `ConflictError` | 409 | Duplicate resources, conflicts |
| `DatabaseError` | 500 | Database operation failures |
| `FileError` | 400 | File operation failures |
| `ExternalServiceError` | 502 | External service failures |
| `APIError` | 500 | Generic API errors |

### Error Severity Levels

- **LOW**: Validation errors, missing fields
- **MEDIUM**: Business logic errors, conflicts
- **HIGH**: Database errors, external service failures
- **CRITICAL**: System failures, security issues

## Usage Examples

### Basic Error Handling

```python
from app.utils.error_handlers import ValidationError, NotFoundError, handle_errors

@handle_errors
def get_user(user_id):
    if not user_id:
        raise ValidationError("User ID is required", field="user_id")
    
    user = find_user(user_id)
    if not user:
        raise NotFoundError("User not found", resource_type="user")
    
    return user
```

### Validation Functions

```python
from app.utils.error_handlers import (
    validate_json_data,
    validate_required_fields,
    validate_numeric_range,
    validate_string_length
)

@handle_errors
def create_user(request):
    # Validate JSON data
    data = validate_json_data(request)
    
    # Validate required fields
    required_fields = ["name", "email", "age"]
    data = validate_required_fields(data, required_fields)
    
    # Validate individual fields
    name = validate_string_length(data["name"], max_length=100, min_length=2, field_name="name")
    age = validate_numeric_range(data["age"], 18, 120, "age")
    
    # Create user...
    return user
```

### Custom Error Responses

```python
from app.utils.error_handlers import create_error_response, APIError, ErrorType, ErrorSeverity

def custom_error_handler():
    error = APIError(
        message="Custom error message",
        error_type=ErrorType.VALIDATION_ERROR,
        status_code=400,
        severity=ErrorSeverity.MEDIUM,
        details={"custom_field": "additional_info"}
    )
    return create_error_response(error, include_details=True)
```

## Error Response Format

All errors follow this standardized format:

```json
{
  "error": {
    "type": "validation_error",
    "message": "Invalid input data",
    "error_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-15T10:30:00.123456",
    "details": {
      "field": "email",
      "missing_fields": ["name", "age"]
    }
  }
}
```

## Validation Functions

### `validate_json_data(request)`
Validates that the request contains valid JSON data.

### `validate_required_fields(data, required_fields)`
Validates that all required fields are present in the data.

### `validate_numeric_range(value, min_val, max_val, field_name)`
Validates that a numeric value is within the specified range.

### `validate_string_length(value, max_length, min_length, field_name)`
Validates that a string meets length requirements.

### `validate_file_type(filename, allowed_extensions)`
Validates file type based on extension.

### `validate_file_size(file_size, max_size)`
Validates file size against maximum allowed size.

## Decorator Usage

The `@handle_errors` decorator automatically handles exceptions:

```python
@handle_errors
def my_function():
    # Any unhandled exceptions will be converted to appropriate APIError types
    result = risky_operation()
    return result
```

## Logging

Errors are automatically logged with structured data:

```python
# Log entry example
{
  "error_id": "550e8400-e29b-41d4-a716-446655440000",
  "error_type": "validation_error",
  "severity": "low",
  "message": "Invalid input data",
  "status_code": 400,
  "timestamp": "2024-01-15T10:30:00.123456",
  "details": {"field": "email"},
  "request_method": "POST",
  "request_url": "/api/v1/users",
  "request_data": "{\"email\": \"invalid\"}",
  "context": {}
}
```

## Migration Guide

### From Old Error Handling

**Before:**
```python
try:
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    if "name" not in data:
        return jsonify({"error": "Name is required"}), 400
        
except Exception as e:
    return handle_api_error(e, "Failed to process request")
```

**After:**
```python
@handle_errors
def my_endpoint():
    data = validate_json_data(request)
    data = validate_required_fields(data, ["name"])
    # Process data...
```

### From Direct JSON Responses

**Before:**
```python
if age < 18:
    return jsonify({"error": "Age must be at least 18"}), 400
```

**After:**
```python
age = validate_numeric_range(data["age"], 18, 120, "age")
```

## Best Practices

1. **Use the decorator**: Apply `@handle_errors` to all route functions
2. **Use validation functions**: Leverage built-in validation helpers
3. **Be specific**: Use appropriate error types and provide meaningful messages
4. **Include context**: Add relevant details to error responses
5. **Log appropriately**: Let the system handle logging automatically
6. **Don't catch APIError**: Let it bubble up to the decorator

## Error Monitoring

### Error IDs
Each error gets a unique UUID for tracking:
- Use in logs for debugging
- Include in user support tickets
- Track error patterns in monitoring systems

### Severity Levels
- **LOW**: Monitor for patterns, no immediate action needed
- **MEDIUM**: Review periodically, may indicate UX issues
- **HIGH**: Investigate promptly, may indicate system issues
- **CRITICAL**: Immediate attention required

## Testing

### Unit Testing Errors

```python
import pytest
from app.utils.error_handlers import ValidationError, NotFoundError

def test_validation_error():
    with pytest.raises(ValidationError) as exc_info:
        validate_numeric_range("invalid", 0, 100, "test_field")
    
    assert exc_info.value.field == "test_field"
    assert exc_info.value.status_code == 400

def test_not_found_error():
    with pytest.raises(NotFoundError) as exc_info:
        raise NotFoundError("User not found", resource_type="user")
    
    assert exc_info.value.resource_type == "user"
    assert exc_info.value.status_code == 404
```

### Integration Testing

```python
def test_error_response_format(client):
    response = client.post('/api/v1/users', json={})
    
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'error_id' in response.json['error']
    assert 'type' in response.json['error']
    assert 'message' in response.json['error']
```

## Troubleshooting

### Common Issues

1. **Error not being caught**: Ensure `@handle_errors` decorator is applied
2. **Wrong status code**: Check error type and severity configuration
3. **Missing error details**: Verify error constructor parameters
4. **Logging not working**: Check logger configuration

### Debug Mode

In development, you can enable detailed error responses:

```python
# In your route
return create_error_response(error, include_details=True)
```

This will include additional debugging information in the response.

## Future Enhancements

- Error rate limiting
- Error aggregation and reporting
- Custom error templates
- Error recovery mechanisms
- Performance impact monitoring 