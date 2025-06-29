"""
Pytest configuration and fixtures for the Financial Advisor test suite.
"""

import pytest
import os
import sys
import tempfile
import shutil
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import create_app
from app.db import SessionLocal, engine
from app.models_base import Base, Conversation, Message
from app.utils.database import get_db_session

@pytest.fixture(scope="session")
def app():
    """Create and configure a new app instance for each test session."""
    # Create a temporary directory for test files
    test_upload_dir = tempfile.mkdtemp()
    
    # Configure the app for testing
    app = create_app()
    app.config.update({
        'TESTING': True,
        'UPLOAD_FOLDER': test_upload_dir,
        'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,  # 16MB
    })
    
    # Create test database tables
    with app.app_context():
        Base.metadata.create_all(bind=engine)
        yield app
        Base.metadata.drop_all(bind=engine)
    
    # Clean up test files
    shutil.rmtree(test_upload_dir, ignore_errors=True)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

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
def sample_conversation(app):
    """Create a sample conversation for testing."""
    with app.app_context():
        with get_db_session() as session:
            conversation = Conversation(
                title="Test Conversation",
                tags=["test", "sample"]
            )
            session.add(conversation)
            session.commit()
            session.refresh(conversation)
            
            # Get the conversation ID for later use
            conversation_id = conversation.id
            
            # Return the ID instead of the detached object
            yield conversation_id
            
            # Clean up
            try:
                conversation_to_delete = session.get(Conversation, conversation_id)
                if conversation_to_delete:
                    session.delete(conversation_to_delete)
                    session.commit()
            except:
                pass

@pytest.fixture
def sample_messages(app, sample_conversation):
    """Create sample messages for testing."""
    with app.app_context():
        with get_db_session() as session:
            messages = [
                Message(
                    conversation_id=sample_conversation,
                    role="user",
                    content="Hello, I need financial advice."
                ),
                Message(
                    conversation_id=sample_conversation,
                    role="assistant",
                    content="Hello! I'd be happy to help you with financial advice. What specific questions do you have?"
                )
            ]
            
            for message in messages:
                session.add(message)
            session.commit()
            
            # Return message IDs instead of detached objects
            message_ids = [msg.id for msg in messages]
            yield message_ids
            
            # Clean up
            try:
                for msg_id in message_ids:
                    msg_to_delete = session.get(Message, msg_id)
                    if msg_to_delete:
                        session.delete(msg_to_delete)
                session.commit()
            except:
                pass

@pytest.fixture
def mock_openai():
    """Mock OpenAI API responses."""
    with patch('app.services.chat.OpenAI') as mock_openai_class:
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        # Mock successful response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a mock AI response."
        mock_client.chat.completions.create.return_value = mock_response
        yield mock_client

@pytest.fixture
def sample_calculator_data():
    """Sample data for calculator tests."""
    return {
        "retirement": {
            "current_age": 30,
            "retirement_age": 65,
            "current_savings": 50000,
            "monthly_contribution": 1000,
            "expected_return": 7.0,
            "life_expectancy": 85,
            "inflation_rate": 2.5,
            "social_security_income": 2000,
            "pension_income": 0,
            "desired_retirement_income": 80000
        },
        "mortgage": {
            "loan_amount": 300000,
            "interest_rate": 4.5,
            "loan_term_years": 30,
            "down_payment": 60000,
            "property_tax": 3600,
            "insurance": 1200,
            "pmi_rate": 0.5
        },
        "compound_interest": {
            "principal": 10000,
            "interest_rate": 6.0,
            "time_period": 10,
            "compounding_frequency": "monthly",
            "monthly_contribution": 500,
            "tax_rate": 25.0,
            "inflation_rate": 2.0,
            "contribution_increase_rate": 3.0
        }
    }

@pytest.fixture
def sample_file():
    """Create a sample file for upload testing."""
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
    temp_file.write("This is a sample financial document for testing.")
    temp_file.close()
    
    yield temp_file.name
    
    # Clean up
    os.unlink(temp_file.name)

@pytest.fixture
def auth_headers():
    """Mock authentication headers."""
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

# Test data utilities
class TestData:
    """Utility class for creating test data."""
    
    @staticmethod
    def create_conversation_data(title="Test Conversation", tags=None):
        """Create conversation test data."""
        return {
            "title": title,
            "tags": tags or ["test"]
        }
    
    @staticmethod
    def create_message_data(content="Test message", role="user"):
        """Create message test data."""
        return {
            "content": content,
            "role": role
        }
    
    @staticmethod
    def create_invalid_data():
        """Create invalid test data for error testing."""
        return {
            "invalid_field": "invalid_value"
        }

# Helper functions for common test operations
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

def create_test_file(content="Test content", extension=".txt"):
    """Create a temporary test file."""
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix=extension, delete=False)
    temp_file.write(content)
    temp_file.close()
    return temp_file.name 