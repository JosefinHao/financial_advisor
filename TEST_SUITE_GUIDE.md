# Financial Advisor Test Suite Guide

## Overview

This comprehensive test suite ensures the reliability, security, and performance of the Financial Advisor application. It covers backend API testing, frontend component testing, database integration, error handling, security validation, and performance benchmarking.

## Test Structure

```
tests/
├── __init__.py                 # Test package initialization
├── conftest.py                 # Pytest configuration and fixtures
├── test_api_endpoints.py       # API endpoint tests
├── test_utils.py              # Utility function tests
├── test_integration.py        # Integration tests
└── test_frontend_components.py # Frontend component tests
```

## Test Categories

### 1. Unit Tests (`test_utils.py`)
- **Error Handling**: Validation, error types, response formatting
- **Database Utilities**: Session management, connection handling
- **Document Processing**: File extraction, AI analysis
- **Validation Functions**: Input validation, data sanitization

### 2. API Tests (`test_api_endpoints.py`)
- **Health Endpoints**: `/health`, `/ping`, `/api`
- **Conversation Management**: CRUD operations, message handling
- **Calculator Endpoints**: Retirement, mortgage, compound interest
- **Document Management**: Upload, analysis, history
- **Dashboard**: Statistics, analytics
- **Error Handling**: 404, 405, validation errors

### 3. Integration Tests (`test_integration.py`)
- **System Integration**: Full workflow testing
- **Database Integration**: Transaction handling, data persistence
- **Error Propagation**: Cross-component error handling
- **Performance**: Concurrent requests, large datasets
- **Security**: Input validation, file upload security

### 4. Frontend Tests (`test_frontend_components.py`)
- **Component Structure**: File existence, dependencies
- **React Components**: Rendering, user interactions
- **API Integration**: Service layer testing
- **Build Process**: Configuration, environment setup

## Running Tests

### Prerequisites

1. **Install test dependencies**:
   ```bash
   pip install -r requirements-test.txt
   ```

2. **Set up test environment**:
   ```bash
   # Copy environment variables
   cp env.example .env.test
   
   # Configure test database
   export DATABASE_URL="postgresql://user:pass@localhost:5432/financial_advisor_test"
   ```

### Basic Test Commands

```bash
# Run all tests
python run_tests.py

# Run specific test categories
python run_tests.py --unit
python run_tests.py --api
python run_tests.py --integration
python run_tests.py --frontend

# Run with pytest directly
python -m pytest tests/
python -m pytest tests/test_api_endpoints.py -v
```

### Advanced Test Commands

```bash
# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Run specific test classes
python -m pytest tests/test_api_endpoints.py::TestConversationEndpoints

# Run tests in parallel
python -m pytest tests/ -n auto

# Run tests with markers
python -m pytest tests/ -m "not slow"
python -m pytest tests/ -m "security"
```

### Test Runner Script

The `run_tests.py` script provides a comprehensive testing interface:

```bash
# Run all tests and checks
python run_tests.py --all

# Run specific checks
python run_tests.py --lint
python run_tests.py --security
python run_tests.py --performance

# Generate test report
python run_tests.py --report
```

## Test Configuration

### Pytest Configuration (`pytest.ini`)

```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
    --disable-warnings
    --color=yes
    --durations=10
    --cov=app
    --cov-report=term-missing
    --cov-report=html:htmlcov
    --cov-report=xml
```

### Test Markers

- `@pytest.mark.unit`: Unit tests
- `@pytest.mark.integration`: Integration tests
- `@pytest.mark.api`: API tests
- `@pytest.mark.database`: Database tests
- `@pytest.mark.frontend`: Frontend tests
- `@pytest.mark.slow`: Slow running tests
- `@pytest.mark.security`: Security tests
- `@pytest.mark.performance`: Performance tests

## Test Fixtures

### Database Fixtures

```python
@pytest.fixture
def db_session():
    """Create a fresh database session for each test."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def sample_conversation(db_session):
    """Create a sample conversation for testing."""
    conversation = Conversation(title="Test Conversation", tags=["test"])
    db_session.add(conversation)
    db_session.commit()
    return conversation
```

### Mock Fixtures

```python
@pytest.fixture
def mock_openai():
    """Mock OpenAI API responses."""
    with patch('app.services.chat.OpenAI') as mock_openai_class:
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        yield mock_client
```

## Test Data Management

### Sample Data Fixtures

```python
@pytest.fixture
def sample_calculator_data():
    """Sample data for calculator tests."""
    return {
        "retirement": {
            "current_age": 30,
            "retirement_age": 65,
            "current_savings": 50000,
            # ... more fields
        },
        "mortgage": {
            "loan_amount": 300000,
            "interest_rate": 4.5,
            # ... more fields
        }
    }
```

### Test File Creation

```python
def create_test_file(content="Test content", extension=".txt"):
    """Create a temporary test file."""
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix=extension, delete=False)
    temp_file.write(content)
    temp_file.close()
    return temp_file.name
```

## Assertion Helpers

### Response Assertions

```python
def assert_error_response(response, expected_status_code, expected_error_type=None):
    """Assert that a response contains a properly formatted error."""
    assert response.status_code == expected_status_code
    data = response.get_json()
    assert 'error' in data
    assert 'error_id' in data['error']
    assert 'timestamp' in data['error']
    assert 'type' in data['error']
    assert 'message' in data['error']
    
    if expected_error_type:
        assert data['error']['type'] == expected_error_type

def assert_success_response(response, expected_status_code=200):
    """Assert that a response is successful."""
    assert response.status_code == expected_status_code
    data = response.get_json()
    assert data is not None
```

## Coverage Reporting

### HTML Coverage Report

After running tests with coverage, view the HTML report:

```bash
# Open in browser
open htmlcov/index.html
```

### Coverage Configuration

```ini
[run]
source = app
omit = 
    */tests/*
    */venv/*
    */__pycache__/*
    */migrations/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-test.txt
      - name: Run tests
        run: python run_tests.py --all
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## Best Practices

### 1. Test Organization

- Group related tests in classes
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### 2. Test Data

- Use fixtures for reusable test data
- Clean up test data after tests
- Use realistic but minimal test data
- Avoid hardcoded values

### 3. Mocking

- Mock external dependencies
- Mock time-consuming operations
- Mock network calls
- Use appropriate mock levels

### 4. Error Testing

- Test both success and failure scenarios
- Test edge cases and boundary conditions
- Test error message content
- Test error response format

### 5. Performance Testing

- Test with realistic data volumes
- Monitor memory usage
- Test concurrent operations
- Set appropriate timeouts

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check database URL configuration
   - Ensure test database exists
   - Verify database permissions

2. **Import Errors**:
   - Check Python path configuration
   - Verify virtual environment activation
   - Check for circular imports

3. **Test Timeouts**:
   - Increase timeout values
   - Optimize slow tests
   - Use appropriate markers

4. **Coverage Issues**:
   - Check coverage configuration
   - Verify source paths
   - Review excluded files

### Debugging Tests

```bash
# Run tests with debug output
python -m pytest tests/ -v -s

# Run specific test with debugger
python -m pytest tests/test_api_endpoints.py::test_create_conversation -s --pdb

# Run tests with detailed output
python -m pytest tests/ --tb=long
```

## Test Maintenance

### Regular Tasks

1. **Update test data** when models change
2. **Review test coverage** regularly
3. **Update mocks** when external APIs change
4. **Refactor tests** for better maintainability
5. **Add tests** for new features

### Test Review Checklist

- [ ] All new features have tests
- [ ] Error scenarios are covered
- [ ] Edge cases are tested
- [ ] Performance implications are considered
- [ ] Security aspects are validated
- [ ] Tests are readable and maintainable

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Flask Testing](https://flask.palletsprojects.com/en/2.3.x/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started) 